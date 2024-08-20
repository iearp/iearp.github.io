// data_cidades from data_cidades.js "cod","cod_estado","nome","is_parceiro","lat","lon"
// data_escolas from data_escolas.js "cod", "lat", "lon", "cod_municipio", "cod_estado", "nome", "localizacao", "rede"
// data_indicadores_escolas from data_indicadores_escolas.js "cod", "ano", "lp", "mat", "pc", "tier_lp", "tier_mat", "tier_pc"

function getColoredIcon(color) {
    var svg = `

        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path 
            fill=${color} fill-opacity="1" stroke="#36454F" stroke-width="8"
            d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z"/>
        </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [32, 42], // size of the icon
        iconAnchor: [12, 36], // point of the icon which will correspond to marker's location
    });
}

//0-25
const tierFourColor = "#dc2626", tierThreeColor = "#ff6701", tierTwoColor = "#fde620", tierOneColor = "#54b400";
const TierFour = {
    "descricao": 
    {
        "quantil": "0 - 25 %",
        "absoluto": "0 - 25 %" 
    },
    "icone": `background: ${tierFourColor};width:1rem;height:1rem;`,
    "marker": getColoredIcon(tierFourColor)
};
//25-50
const TierThree = {
    "descricao": 
    {
        "quantil": "25 - 50 %",
        "absoluto": "25 - 50 %" 
    },
    "icone": `background: ${tierThreeColor};width:1rem;height:1rem;`,
    "marker": getColoredIcon(tierThreeColor)
};
//50-75
const TierTwo = {
    "descricao": 
    {
        "quantil": "50 - 75 %",
        "absoluto": "50 - 70 %" 
    },
    "icone": `background: ${tierTwoColor};width:1rem;height:1rem;`,
    "marker": getColoredIcon(tierTwoColor)
};
//75-100
const TierOne = {
    "descricao": 
    {
        "quantil": "75 - 100 %",
        "absoluto": "70 - 100 %" 
    },
    "icone": `background: ${tierOneColor};width:1rem;height:1rem;`,
    "marker": getColoredIcon(tierOneColor)
};

elementosLegenda = [TierOne, TierTwo, TierThree, TierFour];

function getSchoolsFromCity() {
    const selectedCityCode = document.getElementById('menu-item-cidade').value;
    const selectedLocalizacao = document.getElementById('menu-item-localizacao').value;

    const filteredSchoolsByCityCode = data_escolas.filter(escola => escola.cod_municipio === selectedCityCode);
    
    const filteredSchoolsByRede = filteredSchoolsByCityCode.filter(escola => escola.rede === 'Municipal');

    const filteredSchoolsByLocalizacao = (selectedLocalizacao === "Todas" ? filteredSchoolsByRede : filteredSchoolsByRede.filter(escola => escola.localizacao === selectedLocalizacao));
    
    return filteredSchoolsByLocalizacao;
}

function getIndicadorForSchool(cod_escola, etapa, ano) {
    return data_indicadores_escolas.filter(indicador => indicador.cod == cod_escola && indicador.ano == ano && indicador.etapa == etapa)?.pop()
}

function renderMap() {
    markersLayer.clearLayers();
    
    const filteredSchools = getSchoolsFromCity();

    const selectedCity = data_cidades.find(cidade => cidade.cod == document.getElementById('menu-item-cidade').value);
    const selectedIndicador = document.getElementById('menu-item-indicador').value;
    const selectedAno = document.getElementById('menu-item-ano').value;
    const selectedEtapa = document.getElementById('menu-item-etapa').value;

    map.setView([selectedCity.lat, selectedCity.lon], map.getZoom());

    filteredSchools.forEach(function(escola) {
        
        const indicador_escola = getIndicadorForSchool(escola.cod, selectedEtapa, selectedAno);
        
        let tier_indicador = 0, valor_indicador = "N/A";
        let icone;
        
        if(indicador_escola != undefined) {
            switch(selectedIndicador) {
                case "pca":
                    tier_indicador = indicador_escola?.tier_pc;
                    valor_indicador = indicador_escola?.pc;
                    break;
                case "lp":
                    tier_indicador = indicador_escola?.tier_lp;
                    valor_indicador = indicador_escola?.lp;
                    break;
                case "mat":
                    tier_indicador = indicador_escola?.tier_mat;
                    valor_indicador = indicador_escola?.mat;
                    break;
            }
        }
        
        switch(tier_indicador) {
            case 1:
                icone = TierOne;
                break;
            case 2:
                icone = TierTwo;
                break;
            case 3:
                icone = TierThree;
                break;
            case 4:
                icone = TierFour;
                break;
            default:
                icone = null;
        }
        console.log(indicador_escola, escola.cod, indicador_escola, selectedIndicador,tier_indicador, valor_indicador);
        
        if(escola.lat != null && escola.lon != null && icone != null)
            L.marker([escola.lat, escola.lon], {icon: icone.marker}).bindPopup(`<b>${escola.nome}</b><br>codigo: ${escola.cod}<br>rede: ${escola.rede}<br>valor indicador: ${valor_indicador}`).addTo(markersLayer);
    });
}

var map = L.map('map');
var markersLayer = L.layerGroup().addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.setZoom(12);
var caption = L.control({position: "bottomleft"});
caption.onAdd = function() {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += '<h4 style="text-align:center;font-weight: 800;font-size:1.125rem;">Legenda: </h4><br>';

    const selectedIndicador = document.getElementById('menu-item-indicador').value;
    elementosLegenda.forEach(function(elemento) {
        div.innerHTML += `<div class="legendItem"><div style="${elemento.icone}"></div><span>${selectedIndicador === "pca" ? elemento.descricao.quantil : elemento.descricao.absoluto}</span></div><br>`;
    });
  
    return div;
};
caption.addTo(map);

renderMap();

Array.from(document.getElementsByClassName('reactive-control')).forEach(function(elemento) { elemento.addEventListener('change', () => {
    renderMap();
})});