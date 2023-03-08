const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Overlay} = Me.imports.Overlay;
const Utils = Me.imports.Utils;

const INDICATOR_ICON = "face-smile-symbolic";
const INDICATOR_ICON_HAPPY = "face-smile-big-symbolic";

let indicator;
let overlay;

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {

        _init() {
            super._init(0.0, "Indicator");

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
            menuItemToggle.connect("activate", this._onTogglePress.bind(this));

            let menuItemPrefs = new PopupMenu.PopupMenuItem("Settings");
            this.menu.addMenuItem(menuItemPrefs);
            menuItemPrefs.connect("activate", this._onPrefsPress.bind(this));
        }

        _onTogglePress() {
            if (overlay.isVisible()) {
                overlay.hide();
                this.icon.icon_name = INDICATOR_ICON;
            } else {
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
    indicator = new Indicator();
    Main.panel.addToStatusArea("ChatGptIndicator", indicator, 1);

    let settings = Utils.getSettings();

    console.log("register shortcut");

    // register shortcut
    Main.wm.addKeybinding("shortcut-toggle-overlay", settings,
        Meta.KeyBindingFlags.NONE,
        Shell.ActionMode.NORMAL,
        indicator._onTogglePress.bind(indicator));
}

function disable() {
    indicator.destroy();
    overlay.destroy();

    indicator = null;
    overlay = null;

    Main.wm.removeKeybinding("shortcut-toggle-overlay");
}
