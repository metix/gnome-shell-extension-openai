const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Pango = imports.gi.Pango;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

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
            y_align: St.Align.START,
            overlay_scrollbars: false,
            y_expand: true,
            x_expand: true
        });

        this.overlay.add_child(this.chatScroller);

        this.chatContainer = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.START,
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
            let chat = "You: " + question.trim() + "\n\n" + "AI: " + answer.trim();

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
        let chatEntry = new St.Entry({
            style_class: 'chat-entry',
            text: msg
        });

        chatEntry.clutter_text.set_single_line_mode(false);
        chatEntry.clutter_text.set_use_markup(false);
        chatEntry.clutter_text.set_activatable(true);
        chatEntry.clutter_text.set_line_wrap(true);
        chatEntry.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        chatEntry.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        chatEntry.clutter_text.set_editable(false);
        chatEntry.clutter_text.set_max_length(0);

        let chatEntryContainer = new St.BoxLayout({
            vertical: true,
            y_expand: true
        });

        chatEntryContainer.add_child(chatEntry);

        this.chatContainer.add(chatEntryContainer);

        // workaround. otherwise the chatEntry
        // gets smaller if the scroll container is filled
        chatEntryContainer.height = chatEntry.height;

        Util.ensureActorVisibleInScrollView(this.chatScroller, chatEntryContainer)
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
}