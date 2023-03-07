const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Pango = imports.gi.Pango;

const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;

const Me = ExtensionUtils.getCurrentExtension();

const {OpenAiClient} = Me.imports.OpenAiClient;
const openaiClient = new OpenAiClient();

const OVERLAY_HEIGHT = 600;
const OVERLAY_WIDTH = 1000;

const ICON_LOADING_FINISHED = "object-select-symbolic";
const ICON_LOADING = "content-loading-symbolic"

var Overlay = class Overlay {

    constructor() {
        this.overlay = new St.BoxLayout({
            style_class: 'overlay',
            vertical: true
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

        this.inputContainer = new St.BoxLayout({
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
                this._onClearHistoryPress();
                return true;
            }
        });

        this.inputContainer.add(this.inputQuestion);

        this.loadingSpinner = new St.Icon({
            icon_name: ICON_LOADING_FINISHED,
            icon_size: 30
        });

        this.inputContainer.add(this.loadingSpinner);

        this.inputQuestion.clutter_text.connect('activate', this._onQuestionEnter.bind(this));

        this.overlay.add_child(this.inputContainer);

        this.chatScroller = new St.ScrollView({
            style_class: 'vfade',
            enable_mouse_scrolling: true,
            vscrollbar_policy: St.PolicyType.ALWAYS,
            hscrollbar_policy: St.PolicyType.NEVER,
            overlay_scrollbars: false,
            y_expand: true,
            x_expand: true
        });

        this.overlay.add_child(this.chatScroller);

        this.chatContainer = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: false,
        });

        this.chatScroller.add_actor(this.chatContainer);

        this.controlsContainer = new St.BoxLayout({
            style_class: 'controls-container',
            vertical: false
        });

        this.btnClearHistory = new St.Button({
            label: "Clear History",
            style_class: 'button'
        });

        this.btnClearHistory.connect('button-press-event', this._onClearHistoryPress.bind(this));

        this.controlsContainer.add_child(this.btnClearHistory);

        this.overlay.add_child(this.controlsContainer);
    }

    _onQuestionEnter() {
        this.loadingSpinner.set_icon_name(ICON_LOADING);
        this.loadingSpinner.queue_relayout();

        let question = this.inputQuestion.text;

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
        let chatEntry = new Clutter.Text({
            text: msg,
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
            color: new Clutter.Color({red: 50, green: 50, blue: 50, alpha: 255}),
            selection_color: new Clutter.Color({red: 255, green: 153, blue: 51, alpha: 100}),
            reactive: true
        })

        chatEntry.connect('key-press-event', (object, event) => {
            let symbol = event.get_key_symbol();
            let code = event.get_key_code();
            let state = event.get_state();

            console.log("code: " + code);

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

        let chatEntryContainer = new St.Bin({
            style_class: "chat-entry-container"
        });
        chatEntryContainer.add_actor(chatEntry);

        this.chatContainer.add(chatEntryContainer);

        Util.ensureActorVisibleInScrollView(this.chatScroller, chatEntry);
    }

    _onClearHistoryPress() {
        this.inputQuestion.set_text("");
        openaiClient.clearHistory();
        let chats = this.chatContainer.get_children();

        chats.forEach(c => this.chatContainer.remove_child(c));
    }

    show() {
        this.overlay.visible = true;

        // hack: focus on question-input when overlay is shown
        let a = Mainloop.timeout_add(50, () => {
            global.stage.set_key_focus(this.inputQuestion);
            Mainloop.source_remove(a);
        });
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