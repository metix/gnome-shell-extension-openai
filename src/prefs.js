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

    const openAiApiKeyRow = new Adw.ActionRow({title: 'OpenAI-Api-Key'});
    group.add(openAiApiKeyRow);

    const openaiApiKey = new Gtk.Entry({
        hexpand: true
    });

    openaiApiKey.text = settings.get_string("openai-api-key");

    settings.bind("openai-api-key", openaiApiKey, 'text', Gio.SettingsBindFlags.DEFAULT);

    openAiApiKeyRow.add_suffix(openaiApiKey);
    openAiApiKeyRow.activatable_widget = openaiApiKey;

    const systemPromptRow = new Adw.ActionRow({title: 'System Prompt (optional)'});
    group.add(systemPromptRow);

    const systemPrompt = new Gtk.Entry({
        hexpand: true
    });

    systemPrompt.text = settings.get_string("system-prompt");

    settings.bind("system-prompt", systemPrompt, 'text', Gio.SettingsBindFlags.DEFAULT);

    systemPromptRow.add_suffix(systemPrompt);
    systemPromptRow.activatable_widget = systemPrompt;

    const debugModeRow = new Adw.ActionRow({title: 'Debug Mode'});
    group.add(debugModeRow);

    const debugModeToggle = new Gtk.Switch({
        active: settings.get_boolean('debug-mode'),
        valign: Gtk.Align.CENTER,
    });
    settings.bind('debug-mode', debugModeToggle, 'active', Gio.SettingsBindFlags.DEFAULT);

    // Add the switch to the row
    debugModeRow.add_suffix(debugModeToggle);
    debugModeRow.activatable_widget = debugModeToggle;

    // Add our page to the window
    window.add(page);

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        window.close();
    });
}