const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;

const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {OpenAiClient} = Me.imports.OpenAiClient;
const {Overlay} = Me.imports.Overlay;

const INDICATOR_ICON = 'face-smile-symbolic';

const openaiClient = new OpenAiClient();

let chatGptIndicator;
let overlay;

const ChatGptIndicator = GObject.registerClass(
    class ChatGptIndicator extends PanelMenu.Button {

        _init() {
            super._init(0.0, "ChatGptIndicator");

            let hbox = new St.BoxLayout();

            this.icon = new St.Icon({
                icon_name: INDICATOR_ICON,
                style_class: 'system-status-icon'
            });
            hbox.add_child(this.icon);
            this.add_child(hbox);

            this._buildMenu();
        }

        _buildMenu() {

            let menuItemToggle = new PopupMenu.PopupMenuItem(_('Toggle'));
            this.menu.addMenuItem(menuItemToggle);
            menuItemToggle.connect('activate', Lang.bind(this, this._onTogglePress));

            let menuItemPrefs = new PopupMenu.PopupMenuItem(_('Settings'));
            this.menu.addMenuItem(menuItemPrefs);
            menuItemPrefs.connect('activate', Lang.bind(this, this._onPrefsPress));
        }

        _onTogglePress() {
            if (overlay.isVisible())
                overlay.hide();
            else
                overlay.show();
        }

        _onPrefsPress() {
            overlay.hide();
            ExtensionUtils.openPrefs();
        }

        destroy() {
            super.destroy();
        }
    }
)


function init() {

}


function enable() {
    overlay = new Overlay();
    chatGptIndicator = new ChatGptIndicator();
    Main.panel.addToStatusArea('ChatGptIndicator', chatGptIndicator, 1);

    // setup shortcut "Super + S"
    Main.overview._specialToggle = function (evt) {
        chatGptIndicator._onTogglePress();
    };
    Main.wm.setCustomKeybindingHandler(
        "toggle-overview",
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
        Main.overview._specialToggle.bind(this, Main.overview)
    );
}

function disable() {
    chatGptIndicator.destroy();
    chatGptIndicator = null;
}
