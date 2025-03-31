import { createApp } from 'vue';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify();

createApp(App).use(vuetify).mount('#app');
import { defineComponent, ref } from 'vue';
import MapDisplay from './components/MapDisplay.vue';
import Papa from 'papaparse';

export default defineComponent({
  name: 'App',
  components: { MapDisplay },
  setup() {
    const inputIP = ref('');
    const result = ref(false);
    const isAwsIP = ref(false);
    const region = ref('');
    const service = ref('');
    const locationData = ref(null);
    let awsRanges = null;
    let geoIpData = [];

    // Load AWS IP ranges
    fetch('data/ip-ranges.json')
      .then(response => response.json())
      .then(data => awsRanges = data)
      .catch(error => console.error('Error loading AWS ranges:', error));

    // Load Geo IP CSV file
    fetch('data/geo-ip-feed.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => geoIpData = results.data
        });
      })
      .catch(error => console.error('Error loading Geo IP data:', error));

    // Function to check IP against CIDR
    function isIpInCidr(ip, cidr) {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const ipNum = ipToNumber(ip);
      const rangeNum = ipToNumber(range);
      return (ipNum & mask) === (rangeNum & mask);
    }

    function ipToNumber(ip) {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }

    const checkIP = () => {
      result.value = false;
      isAwsIP.value = false;
      region.value = '';
      service.value = '';
      locationData.value = null;

      if (!awsRanges || !geoIpData.length) return;

      // Check AWS ranges
      const found = awsRanges.prefixes.find(prefix => isIpInCidr(inputIP.value.trim(), prefix.ip_prefix));
      if (found) {
        isAwsIP.value = true;
        region.value = found.region;
        service.value = found.service;
      }

      // Check Geo-IP data for more details
      const geoMatch = geoIpData.find(entry => isIpInCidr(inputIP.value.trim(), entry.ip));
      if (geoMatch) {
        locationData.value = geoMatch;
      }

      result.value = true;
    };

    return { inputIP, checkIP, result, isAwsIP, region, service, locationData };
  }
});
