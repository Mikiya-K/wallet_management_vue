<template>
  <div class="error-page">
    <h1>404</h1>
    <p>Oops! The page you are looking for does not exist.</p>
    <router-link to="/" class="home-link">Go to Home</router-link>
  </div>
</template>

<script>
export default {
  name: "ErrorPage",
};
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
}

h1 {
  font-size: 72px;
  color: #ff0000;
}

p {
  font-size: 20px;
  color: #333;
}

.home-link {
  font-size: 18px;
  color: #007bff;
  text-decoration: none;
}

.home-link:hover {
  text-decoration: underline;
}
</style>
