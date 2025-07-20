let nextId = 1;
const genId = () => nextId++;

module.exports = {
  products: [
    { id: genId(), name: "Оксиген медичний" },
    { id: genId(), name: "Азот" },
    { id: genId(), name: "Аргон" },
    { id: genId(), name: "Кисень" },
    { id: genId(), name: "Кисень Медичний" },
    { id: genId(), name: "Вуглекислота" },
    { id: genId(), name: "Водень" },
    { id: genId(), name: "Суміші" },
    { id: genId(), name: "Гелій" },
    { id: genId(), name: "Вуглекислий газ" },
  ],
  locations: [
    { id: genId(), name: "Дніпро" },
    { id: genId(), name: "Київ" },
  ],
};
