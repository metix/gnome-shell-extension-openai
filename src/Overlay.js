const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Pango = imports.gi.Pango;

const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.Utils;

const {OpenAiClient} = Me.imports.OpenAiClient;
const openaiClient = new OpenAiClient();

const OVERLAY_HEIGHT = 600;
const OVERLAY_WIDTH = 1000;

const ICON_LOADING_FINISHED = "object-select-symbolic";
const ICON_LOADING = "content-loading-symbolic"

var ChatMessage = GObject.registerClass(
    class ChatMessage extends St.Bin {
        _init(params) {
            super._init({
                style_class: 'message'
            });

            this._text = new Clutter.Text({
                text: params.text,
                single_line_mode: false,
                line_wrap: true,
                line_wrap_mode: Pango.WrapMode.WORD,
                editable: false,
                selectable: true,
                margin_top: 10,
                margin_left: 10,
                font_name: "Sans 10",
                margin_right: 10,
                margin_bottom: 10,
                cursor_visible: true,
                use_markup: true,
                selection_color: new Clutter.Color({red: 255, green: 153, blue: 51, alpha: 100}),
                reactive: true
            })

            this._text.connect('key-press-event', (object, event) => {
                let code = event.get_key_code();
                let state = event.get_state();

                // Ctrl + A
                if (state === 4 && code === 38) {
                    object.set_selection(0, object.text.length);
                    return true;
                }
                // Ctrl + C
                else if (state === 4 && code === 54) {
                    let clipboard = St.Clipboard.get_default();
                    let selection = object.get_selection();
                    clipboard.set_text(St.ClipboardType.CLIPBOARD, selection);
                    return true;
                }
            });

            this.add_actor(this._text);
        }

        vfunc_paint(paint_context) {
            super.vfunc_paint(paint_context);

            if (Utils.isGnomeDarkModeEnabled()) {
                this._text.color = new Clutter.Color({red: 200, green: 200, blue: 200, alpha: 255})
            } else {
                this._text.color = new Clutter.Color({red: 20, green: 20, blue: 20, alpha: 255})
            }
        }
    }
)

var Overlay = class Overlay {

    constructor(indicator) {
        this.indicator = indicator;

        this.questionHistory = [];
        this.questionHistoryIndex = 0;

        this.overlay = new St.BoxLayout({
            style_class: 'modal-dialog',
            vertical: true,
            reactive: true
        });

        this.overlay.connect('key-press-event', (object, event) => {
            let code = event.get_key_code();
            let state = event.get_state();

            // close overlay if ESC is pressed
            if (state === 0 && code === 9) {
                this.indicator._onTogglePress();
                return true;
            }

            return false;
        });

        this.overlay.width = OVERLAY_WIDTH;
        this.overlay.height = OVERLAY_HEIGHT;
        this.overlay.visible = false;

        Main.layoutManager.addChrome(this.overlay, {affectsInputRegion: true});

        // display the overlay in the center of the screen
        let monitor = Main.layoutManager.primaryMonitor;
        this.overlay.set_position(
            monitor.x + Math.floor(monitor.width / 2 - this.overlay.width / 2),
            monitor.y + Math.floor(monitor.height / 2 - this.overlay.height / 2)
        );

        this._buildQuestionRow();
        this._buildChatRow();
        this._buildMenuRow();

        let showWelcomeBanner = Utils.getSettings().get_boolean("show-welcome-banner");
        if (showWelcomeBanner) {
            this._appendChatMessage("Welcome to OpenAI GNOME Extension.");
            let token = Utils.getSettings().get_string("openai-api-key");
            if (token.length === 0)
                this._appendChatMessage("You need a API-Key to use this extension. Please open settings dialog (or type ':settings') and paste your API-Key.");
            this._appendChatMessage("Shortcuts:\n" +
                "- CTRL + L\tClear History\n" +
                "- ESC\t\tHide Overlay ")

            Utils.getSettings().set_boolean("show-welcome-banner", false);
        }
    }

    _buildQuestionRow() {
        this.questionRow = new St.BoxLayout({
            style_class: 'input-container',
            vertical: false,
            x_expand: true
        });

        this.inputQuestion = new St.Entry({
            style_class: 'question-input',
            can_focus: true,
            hint_text: 'Ask ChatGPT something...',
            track_hover: true,
            x_expand: true
        });

        this.inputQuestion.connect('key-press-event', (object, event) => {
            let code = event.get_key_code();
            let state = event.get_state();

            // Ctrl + L
            if (state === 4 && code === 46) {
                this._onClearChatHistoryPress();
                return true;
            }

            // UP
            if (state === 0 && code === 111) {
                this._chatHistoryScroll(1);
                return true;
            }

            // DOWN
            if (state === 0 && code === 116) {
                this._chatHistoryScroll(-1);
                return true;
            }
        });

        this.questionRow.add(this.inputQuestion);

        this.loadingSpinner = new St.Icon({
            icon_name: ICON_LOADING_FINISHED,
            icon_size: 30
        });

        this.questionRow.add(this.loadingSpinner);

        this.inputQuestion.clutter_text.connect('activate', this._onQuestionEnter.bind(this));

        this.overlay.add_child(this.questionRow);
    }

    _buildChatRow() {
        this.chatRow = new St.ScrollView({
            style_class: 'vfade',
            enable_mouse_scrolling: true,
            vscrollbar_policy: St.PolicyType.ALWAYS,
            hscrollbar_policy: St.PolicyType.NEVER,
            overlay_scrollbars: false,
            y_expand: true,
            x_expand: true
        });

        this.overlay.add_child(this.chatRow);

        this.chatContainer = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: false,
        });

        this.chatRow.add_actor(this.chatContainer);
    }

    _buildMenuRow() {
        this.menuRow = new St.BoxLayout({
            style_class: 'controls-container',
            vertical: false
        });

        this.btnClearHistory = new St.Button({
            label: "Clear History",
            style_class: 'button'
        });

        this.btnClearHistory.connect('button-press-event', this._onClearChatHistoryPress.bind(this));

        this.menuRow.add_child(this.btnClearHistory);

        this.overlay.add_child(this.menuRow);
    }

    _onQuestionEnter() {
        this.loadingSpinner.set_icon_name(ICON_LOADING);
        this.loadingSpinner.queue_relayout();

        let question = this.inputQuestion.text;

        this.questionHistory.push(question);
        this.questionHistoryIndex = 0;

        if (question === ':settings') {
            this.inputQuestion.set_text("");
            this.indicator._onTogglePress();
            ExtensionUtils.openPrefs();
            return;
        }

        openaiClient.ask(question).then(answer => {
            let chat = "<b>You:</b> " + question.trim() + "\n\n" + "<b>AI:</b> " + answer.trim();

            this.inputQuestion.set_text("");

            this._appendChatMessage(chat);

        }).catch(error => {
            console.error(error);
            this._appendChatMessage("Error while try to access OpenAI: " + error);
        }).finally(() => {
            this.loadingSpinner.set_icon_name(ICON_LOADING_FINISHED);
        })
    }

    _appendChatMessage(msg) {
        let chatEntry = new ChatMessage({
            text: msg
        });

        let chatEntryContainer = new St.Bin({
            style_class: "chat-entry-container"
        });
        chatEntryContainer.add_actor(chatEntry);

        this.chatContainer.add(chatEntryContainer);

        Util.ensureActorVisibleInScrollView(this.chatRow, chatEntry);
    }

    _onClearChatHistoryPress() {
        this.inputQuestion.set_text("");
        openaiClient.clearHistory();
        let chats = this.chatContainer.get_children();

        chats.forEach(c => this.chatContainer.remove_child(c));
    }

    _chatHistoryScroll(delta) {
        if ((this.questionHistoryIndex + delta) <= 0) {
            this.inputQuestion.set_text("");
            this.questionHistoryIndex = 0;
            return;
        }

        if ((this.questionHistoryIndex + delta) > this.questionHistory.length)
            return;

        this.questionHistoryIndex += delta;

        let index = this.questionHistory.length - this.questionHistoryIndex;

        let question = this.questionHistory[index];

        this.inputQuestion.set_text(question);
    }

    show() {
        this.overlay.visible = true;
        global.stage.set_key_focus(this.inputQuestion);
    }

    hide() {
        this.overlay.visible = false;
    }

    isVisible() {
        return this.overlay.visible;
    }

    destroy() {
        this.overlay.destroy();
    }
}