export default function install(Vue, { components = false }) {
  if (!components) {
    return;
  }
  components.forEach(([componentName, Component]) => {
    if (!componentName || !Component) {
      return;
    }
    Vue.component(componentName, Component);
  });
}
