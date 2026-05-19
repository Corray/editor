/* @refresh reload */
import { render } from 'solid-js/web';

function App() {
  return (
    <main class="app">
      <h1>editor</h1>
      <p>脚手架就位。M1-M7 模块实现进行中。</p>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
