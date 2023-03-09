/**
 * This HttpClient expects Soup-2.4
 */

const Soup = imports.gi.Soup;

function post(url, headers, body) {
    return new Promise((resolve, reject) => {
        let httpSession = new Soup.Session();
        let message = Soup.Message.new('POST', url);

        for (const [name, value] of Object.entries(headers)) {
            message.request_headers.append(name, value);
        }

        message.set_request('application/json', 2, body);
        httpSession.queue_message(message, () => {
            if (message.status_code === 200) {
                try {
                    let out = JSON.parse(message['response-body'].data);
                    resolve(out);
                } catch (error) {
                    reject(error);
                }
            } else {
                if (message.status_code === 401) {
                    reject("request failed: " + message.status_code + "\nDid you provide your OpenAI-API-Key? (Open Settings)");
                } else {
                    reject("request failed: " + message.status_code);
                }
            }
        });
    })
}