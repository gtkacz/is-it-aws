<template>
  <v-app>
    <v-container class="app-container">
      <v-card class="input-card">
        <v-card-title>Check AWS IP</v-card-title>
        <v-card-text>
          <v-text-field label="Enter IP address" v-model="inputIP" @keyup.enter="checkIP" outlined></v-text-field>
          <v-btn color="primary" @click="checkIP">Check</v-btn>
        </v-card-text>
      </v-card>

      <div v-if="result" class="result">
        <v-alert type="success" v-if="isAwsIP">
          This IP is an AWS IP (Region: {{ region }}, Service: {{ service }}).
          <br>Location: {{ location }} <span class="flex-con">({{ country }} <country-flag
              :country-code="country" />)</span>
        </v-alert>
        <v-alert type="error" v-else>
          This IP is not found in AWS IP ranges.
        </v-alert>
      </div>

      <div v-if="isAwsIP" class="map-container">
        <MapDisplay :city="location" :country-code="country" />
      </div>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import CountryFlag from './components/CountryFlag.vue';
import MapDisplay from './components/MapDisplay.vue';
import { isIpInCidr } from './utils/ipUtils';

export default defineComponent({
  name: 'App',
  components: { MapDisplay, CountryFlag },
  setup() {
    const inputIP = ref('');
    const result = ref(false);
    const isAwsIP = ref(false);
    const region = ref('');
    const service = ref('');
    const location = ref('');
    const country = ref('');
    const awsRanges = ref(null);
    const geoIpData = ref([]);

    fetch('data/ip-ranges.json')
      .then(response => response.json())
      .then(data => { awsRanges.value = data; });

    fetch('data/geo-ip-feed.csv')
      .then(response => response.text())
      .then(csvText => {
        const rows = csvText.split('\n').map(row => row.split(','));
        geoIpData.value = rows.slice(1).map(([ip, country_code, region_code, location]) => ({ ip, country_code, region_code, location }));
      });

    const checkIP = () => {
      result.value = false;
      isAwsIP.value = false;
      region.value = '';
      service.value = '';
      location.value = '';
      country.value = '';

      if (!awsRanges.value || !geoIpData.value.length) return;

      const found = awsRanges.value.prefixes.find(prefix => isIpInCidr(inputIP.value.trim(), prefix.ip_prefix));
      if (found) {
        isAwsIP.value = true;
        region.value = found.region;
        service.value = found.service;
      }

      const geoMatch = geoIpData.value.find(entry => isIpInCidr(inputIP.value.trim(), entry.ip));
      if (geoMatch) {
        location.value = geoMatch.location;
        country.value = geoMatch.country_code;
      }

      result.value = true;
    };

    return { inputIP, checkIP, result, isAwsIP, region, service, location, country };
  }
});
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');

html * {
  font-family: "Space Grotesk", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.input-card {
  width: 100%;
  max-width: 500px;
  margin-bottom: 2rem;
}

.result {
  width: 100%;
  max-width: 500px;
  margin-bottom: 2rem;
}

.map-container {
  width: 100%;
  max-width: 800px;
  height: 500px;
}

.flex-con {
  display: inline-flex;
  align-items: center;

  & > img {
    margin-left: 0.25rem;
  }
}
</style>