<template>
  <div id="app">
    <!-- Global Navigation -->
    <Navbar />
    <!-- Main Content (views will be displayed here based on routes) -->
    <router-view></router-view>
  </div>
</template>

<script>
import Navbar from "./components/AppNavbar.vue";

export default {
  name: "App",
  components: {
    Navbar,
  },
};
</script>

<style>
/* You can add global styles here */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

nav {
  background-color: #007bff;
  padding: 10px;
  color: white;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 20px;
}

nav a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
}
</style>
