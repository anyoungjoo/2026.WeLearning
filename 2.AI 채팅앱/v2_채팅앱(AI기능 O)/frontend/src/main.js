import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

/**
 * [Vue 3 구동 엔트리 파일] main.js
 * Vue 앱 객체를 생성하고 Vue Router 및 CSS 스타일을 연결합니다.
 */
const app = createApp(App);

app.use(router);
app.mount('#app');
