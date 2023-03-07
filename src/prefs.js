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

    // Add our page to the window
    window.add(page);
}