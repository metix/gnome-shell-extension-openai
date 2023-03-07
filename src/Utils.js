const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

function getSettings() {
    return ExtensionUtils.getSettings(Me.metadata['settings-schema']);
}

function isGnomeDarkModeEnabled() {
    const settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface' });
    const gtkThemeName = settings.get_string('gtk-theme');

    return gtkThemeName.includes('-dark');
}