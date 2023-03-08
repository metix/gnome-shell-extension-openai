const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Overlay} = Me.imports.Overlay;

const INDICATOR_ICON = "face-smile-symbolic";
const INDICATOR_ICON_HAPPY = "face-smile-big-symbolic";

let chatGptIndicator;
let overlay;

const ChatGptIndicator = GObject.registerClass(
    class ChatGptIndicator extends PanelMenu.Button {

        _init() {
            super._init(0.0, "ChatGptIndicator");

            let hbox = new St.BoxLayout();

            this.icon = new St.Icon({
                icon_name: INDICATOR_ICON,
                style_class: "system-status-icon"
            });
            hbox.add_child(this.icon);
            this.add_child(hbox);

            this._buildMenu();
        }

        _buildMenu() {
            let menuItemToggle = new PopupMenu.PopupMenuItem("Toggle");
            this.menu.addMenuItem(menuItemToggle);
            menuItemToggle.connect("activate", this._onTogglePress);

            let menuItemPrefs = new PopupMenu.PopupMenuItem("Settings");
            this.menu.addMenuItem(menuItemPrefs);
            menuItemPrefs.connect("activate", this._onPrefsPress);
        }

        _onTogglePress() {
            if (overlay.isVisible()) {
                overlay.hide();
                this.icon.icon_name = INDICATOR_ICON;
            }
            else {
                overlay.show();
                this.icon.icon_name = INDICATOR_ICON_HAPPY;
            }
        }

        _onPrefsPress() {
            overlay.hide();
            ExtensionUtils.openPrefs();
        }
    }
)


function init() {

}


function enable() {
    // the overlay which opens when shortcut is pressed
    overlay = new Overlay();

    // indicator in the status-menu
    chatGptIndicator = new ChatGptIndicator();
    Main.panel.addToStatusArea("ChatGptIndicator", chatGptIndicator, 1);

    // register shortcut "Super + S"
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
    overlay.destroy();

    chatGptIndicator = null;
    overlay = null;
}
