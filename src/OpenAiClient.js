const Soup = imports.gi.Soup;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.Utils;

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-3.5-turbo"

let httpClient;

// we have to use the soup version that is already loaded from gnome shell.
// we cant specify the version.
// to support both soup-2.4 and soup-3.0 we check the version and use different implementations
if (Soup.get_major_version() === 2) {
    httpClient = Me.imports.HttpClientV1;
} else {
    httpClient = Me.imports.HttpClientV2;
}

var OpenAiClient = class OpenAiClient {

    constructor() {
        this.chatHistory = [];
    }

    async ask(question) {
        let systemPrompt = Utils.getSettings().get_string("system-prompt");

        let messages;
        if (systemPrompt.length > 0) {
            messages = [
                {role: 'system', content: systemPrompt},
                ...this.chatHistory,
                {role: 'user', content: question}
            ]
        } else {
            messages = [...this.chatHistory, {role: 'user', content: question}]
        }

        let body = JSON.stringify({
            model: OPENAI_MODEL,
            messages: messages
        });


        let data = await this._apiCall(OPENAI_API_URL, body);

        let answer = data.choices[0].message.content;

        // save question and answer in the chat-history, so that we can append the history
        // in the next question
        this._saveChat(question, answer);

        return answer;
    }

    clearHistory() {
        this.chatHistory = [];
    }

    _saveChat(question, answer) {
        this.chatHistory.push({role: "user", content: question})
        this.chatHistory.push({role: "assistant", content: answer})
    }

    async _apiCall(url, body) {
        let debugMode = Utils.getSettings().get_boolean("debug-mode");

        if (debugMode) {
            let parsedBody = JSON.parse(body);
            let debugMessage = `Hi, I am not chat-GPT i'm just a test response.`;
            if (parsedBody.messages[parsedBody.messages.length - 1].content === ':body')
                debugMessage = body;

            await new Promise(resolve => setTimeout(resolve, 500));

            return {
                choices: [{
                    message: {
                        content: debugMessage
                    }
                }]
            };
        }

        let token = Utils.getSettings().get_string("openai-api-key");

        let headers = {
            'Authorization': `Bearer ${token}`
        };

        return await httpClient.post(url, headers, body);
    }
}