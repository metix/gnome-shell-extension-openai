/**
 * This HttpClient expects Soup-3.0
 */

const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;

async function post(url, headers, body) {
    let httpSession = new Soup.Session();
    let message = Soup.Message.new('POST', url);

    for (const [name, value] of Object.entries(headers)) {
        message.request_headers.append(name, value);
    }

    message.set_request_body_from_bytes('application/json', new GLib.Bytes(body));

    let json;
    try {
        const bytes = await httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null);
        if (message.status_code === 401) {
            throw "request failed: " + message.status_code + "\nDid you provide your OpenAI-API-Key? (Open Settings)";
        }
        json = JSON.parse(new TextDecoder().decode(bytes.get_data()));
        return json;
    } catch (e) {
        throw e;
    }
}