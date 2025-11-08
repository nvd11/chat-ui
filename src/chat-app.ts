import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('chat-app')
export class ChatApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
      font-family: sans-serif;
    }
  `;

  render() {
    return html`
      <h1>Hello World!</h1>
      <p>Chat App is loading...</p>
      <p>If you see this, your local development setup is working correctly.</p>
    `;
  }
}
