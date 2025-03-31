import '@mdi/font/css/materialdesignicons.css';
import Papa from 'papaparse';
import { createApp, defineComponent, ref } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import App from './App.vue';
import MapDisplay from './components/MapDisplay.vue';

const vuetify = createVuetify();

createApp(App).use(vuetify).mount('#app');
