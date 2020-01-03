const form = document.getElementById('searchform');
let searchTerm, searchUrl, pokemon, effectivenessByType;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  searchTerm = e.target['name'].value.toLowerCase();

  document.getElementById('error').classList.add('hide');
  getPokemon(searchTerm)
    .then(populatePokemon)
    .catch(e => {
      document.getElementById('error').classList.remove('hide');
    });
  console.log(pokemon)
})

const getPokemon = async (name) => {
  let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);
  if (res.status === 200) {
    let json = await res.json();
    return json;
  }
  throw new Error(res.status);
}

const populatePokemon = (pokemon) => {
  document.getElementById('pkmn-name').innerHTML = pokemon.name;
  document.getElementById('pkmn-img').src = pokemon.sprites.front_default;
  removeTypes()
  // sort the types by slot
  const types = pokemon.types.sort((a, b) => {
    return a.slot - b.slot;
  })
  // populate types
  reseteffectivenessByType();
  types.forEach(async (type, i) => {
    addPkmnType('pkmn-types', type.type.name);
    await addTypeRelations(type.type.name);
    if (i === types.length - 1) {
      populateTypesInHTML()
    }
  });
}

const reseteffectivenessByType = () => {
  effectivenessByType = {}
}

const addTypeRelations = async (type) => {
  // Get type and add to global effectivenessByType object
  const typeObj = await getType(type);
  sortRelationsToTypes(typeObj.damage_relations);
}

const getType = async (name) => {
  const res = await fetch(`https://pokeapi.co/api/v2/type/${name}`);
  if (res.ok) {
    type = await res.json();
    return type;
  }
}

const sortRelationsToTypes = (relations) => {
  // put double damage from in effectivenessByType['2']
  relations['double_damage_from'].forEach((type) => {
    effectivenessByType[type.name]
      ? effectivenessByType[type.name].push(2)
      : effectivenessByType[type.name] = [2];
  })
  // put half damage from in effectivenessByType['0.5']
  relations['half_damage_from'].forEach((type) => {
    effectivenessByType[type.name]
      ? effectivenessByType[type.name].push(0.5)
      : effectivenessByType[type.name] = [0.5];
  })
  // put no damage from in effectivenessByType['0']
  relations['no_damage_from'].forEach((type) => {
    effectivenessByType[type.name]
      ? effectivenessByType[type.name].push(0)
      : effectivenessByType[type.name] = [0];
  })
}

const removeTypes = () => {
  document.getElementById('pkmn-types').innerHTML = ''
  document.getElementById('pkmn-types-half').innerHTML = ''
  document.getElementById('pkmn-types-double').innerHTML = ''
  document.getElementById('pkmn-types-none').innerHTML = ''
}

const addPkmnType = (location, type) => {
  document.getElementById(location).innerHTML = `${document.getElementById(location).innerHTML} <li class="${type}">${type}</li>`;
}

const populateTypesInHTML = () => {
  let totalEffectiveness = [];
  let typesByEffectiveness = {
    'double': [],
    'half': [],
    'none': []
  };

  Object.keys(effectivenessByType).forEach((type) => {
    totalEffectiveness[type] = effectivenessByType[type].reduce((a, b) => a * b)
  })

  Object.keys(totalEffectiveness).forEach((type) => {
    switch (totalEffectiveness[type]) {
      case 0:
        typesByEffectiveness['none'].push(type);
        break;
      case 0.5:
        typesByEffectiveness['half'].push(type);
        break;
      case 2:
        typesByEffectiveness['double'].push(type);
        break;
      case 4:
        typesByEffectiveness['double'].push(`${type} (x4)`);
        break;
    }
  });

  Object.keys(typesByEffectiveness).forEach((effectiveness) => {
    typesByEffectiveness[effectiveness].length === 0 && typesByEffectiveness[effectiveness].push('none');
    typesByEffectiveness[effectiveness].forEach((type) => {
      addPkmnType(`pkmn-types-${effectiveness}`, type);
    })
  })
}