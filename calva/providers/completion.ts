import { TextDocument, Position, CancellationToken, CompletionContext, Hover, CompletionItemKind, window, CompletionList, CompletionItemProvider, CompletionItem } from 'vscode';
import * as state from '../state';
import * as util from '../utilities';
import { nClient as nClient } from "../connector"

export default class CalvaCompletionItemProvider implements CompletionItemProvider {
    state: any;
    mappings: any;
    constructor() {
        this.state = state;
        this.mappings = {
            'nil': CompletionItemKind.Value,
            'macro': CompletionItemKind.Value,
            'class': CompletionItemKind.Class,
            'keyword': CompletionItemKind.Keyword,
            'namespace': CompletionItemKind.Module,
            'function': CompletionItemKind.Function,
            'special-form': CompletionItemKind.Keyword,
            'var': CompletionItemKind.Variable,
            'method': CompletionItemKind.Method
        };
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        let text = util.getWordAtPosition(document, position);
        if (this.state.deref().get("connected")) {
            let res = await nClient.session.complete(util.getNamespace(document.getText()), text);
            let results = res.completions || [];
            return new CompletionList(
                results.map(item => ({
                    label: item.candidate,
                    kind: this.mappings[item.type] || CompletionItemKind.Text,
                    insertText: item[0] === '.' ? item.slice(1) : item
                })), true);
        }
        return [];
    }

    async resolveCompletionItem(item: CompletionItem, token: CancellationToken) {
        if(this.state.deref().get("connected")) {
            let result = await nClient.session.info(item.insertText["ns"], item.label)
            if(result.doc)
                item.documentation = result.doc;
        }
        return item;
    }
};