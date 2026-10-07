<template>
  <span class="logo">
    <span class="logo__word">epicentric<sup>®</sup></span>
    <span class="logo__tag">
      TECHNOLOGY
      <svg class="logo__mark" width="7" height="5" viewBox="0 0 8 6" aria-hidden="true">
        <path d="M0 0h8L4 6z" fill="currentColor" />
      </svg>
    </span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  flex-direction: column;
  line-height: 1;
}

.logo__word {
  font-size: 24px;
  font-weight: var(--fw-light);
}

.logo__word sup {
  font-size: 10px;
}

.logo__tag {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: var(--s-1);
  font-size: 9px;
  letter-spacing: 4px;
  opacity: 0.65;
}

.logo__mark {
  color: var(--logo-mark);
}
</style>
