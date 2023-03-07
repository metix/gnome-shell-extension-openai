const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

function getSettings() {
    return ExtensionUtils.getSettings(Me.metadata['settings-schema']);
}