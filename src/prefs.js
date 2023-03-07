'use strict';

const {Adw, Gio, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.etixsoftware.openai');

    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a new preferences row
    const row = new Adw.ActionRow({title: 'OpenAI-Api-Key'});
    group.add(row);

    let openaiApiKeyBuffer = new Gtk.EntryBuffer();
    openaiApiKeyBuffer.text = settings.get_string('openai-api-key');

    const openaiApiKey = new Gtk.Entry({
        hexpand: true
    });

    openaiApiKey.text = settings.get_string("openai-api-key");

    settings.bind("openai-api-key", openaiApiKey, 'text', Gio.SettingsBindFlags.DEFAULT);

    row.add_suffix(openaiApiKey);
    row.activatable_widget = openaiApiKey;

    const debugModeRow = new Adw.ActionRow({ title: 'Debug Mode' });
    group.add(debugModeRow);

    // Create the switch and bind its value to the `show-indicator` key
    const toggle = new Gtk.Switch({
        active: settings.get_boolean ('debug-mode'),
        valign: Gtk.Align.CENTER,
    });
    settings.bind('debug-mode', toggle, 'active', Gio.SettingsBindFlags.DEFAULT);

    // Add the switch to the row
    debugModeRow.add_suffix(toggle);
    debugModeRow.activatable_widget = toggle;

    // Add our page to the window
    window.add(page);
}