// data_cidades from data_cidades.js "cod","cod_estado","nome","is_parceiro","lat","lon"
// data_escolas from data_escolas.js "cod", "lat", "lon", "cod_municipio", "cod_estado", "nome", "localizacao", "rede"
// data_indicadores_escolas from data_indicadores_escolas.js "cod", "ano", "lp", "mat", "pc", "tier_lp", "tier_mat", "tier_pc"

function getColoredIcon(color) {
    var svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="3vh">
            <!--! Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. -->
            <path 
            fill=${color} fill-opacity="1" stroke="#36454F" stroke-width="15"
            d="M16 144a144 144 0 1 1 288 0A144 144 0 1 1 16 144zM160 80c8.8 0 16-7.2 16-16s-7.2-16-16-16c-53 0-96 43-96 96c0 8.8 7.2 16 16 16s16-7.2 16-16c0-35.3 28.7-64 64-64zM128 480l0-162.9c10.4 1.9 21.1 2.9 32 2.9s21.6-1 32-2.9L192 480c0 17.7-14.3 32-32 32s-32-14.3-32-32z"/>
        </svg>`;
    return L.divIcon({
        html: svg,
        className: "",
        iconSize: [24, 36], // size of the icon
        iconAnchor: [12, 36], // point of the icon which will correspond to marker's location
    });
}

//0-25
const tierFourColor = "#DF9FA2", tierThreeColor = "#D48084", tierTwoColor = "#C86166", tierOneColor = "#BC4348", tierNullColor = "#F5DFE0";
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
// Quando não se aplica
const TierNull = {
    "descricao": 
    {
        "quantil": "N/A",
        "absoluto": "N/A" 
    },
    "icone": `background: ${tierNullColor};width:1rem;height:1rem;`,
    "marker": getColoredIcon(tierNullColor)
};

elementosLegenda = [TierOne, TierTwo, TierThree, TierFour, TierNull];

function getSchoolsFromCity() {
    const selectedCityCode = document.getElementById('menu-item-cidade').value;
    const selectedRede = document.getElementById('menu-item-rede').value;
    const selectedLocalizacao = document.getElementById('menu-item-localizacao').value;

    const filteredSchoolsByCityCode = data_escolas.filter(escola => escola.cod_municipio === selectedCityCode);
    
    const filteredSchoolsByRede = (selectedRede === "Todas" ? filteredSchoolsByCityCode : filteredSchoolsByCityCode.filter(escola => escola.rede === selectedRede));

    const filteredSchoolsByLocalizacao = (selectedLocalizacao === "Todas" ? filteredSchoolsByRede : filteredSchoolsByRede.filter(escola => escola.localizacao === selectedLocalizacao));
    
    return filteredSchoolsByLocalizacao;
}

function renderMap() {
    markersLayer.clearLayers();
    
    const filteredSchools = getSchoolsFromCity();

    const selectedCity = data_cidades.find(cidade => cidade.cod == document.getElementById('menu-item-cidade').value);
    const selectedIndicador = document.getElementById('menu-item-indicador').value;
    const selectedAno = document.getElementById('menu-item-ano').value;

    map.setView([selectedCity.lat, selectedCity.lon], 15);

    filteredSchools.forEach(function(escola) {
        
        const indicador_escola = data_indicadores_escolas.filter(indicador => indicador.cod == escola.cod && indicador.ano == selectedAno);
        
        let tier_indicador = 0, valor_indicador = "N/A";
        let icone;
        
        if(indicador_escola != undefined) {
            switch(selectedIndicador) {
                case "pca":
                    tier_indicador = indicador_escola.pop()?.tier_pc;
                    valor_indicador = indicador_escola.pop()?.pc;
                    break;
                case "lp":
                    tier_indicador = indicador_escola.pop()?.tier_lp;
                    valor_indicador = indicador_escola.pop()?.lp;
                    break;
                case "mat":
                    tier_indicador = indicador_escola.pop()?.tier_mat;
                    valor_indicador = indicador_escola.pop()?.mat;
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
                icone = TierNull;
        }
        console.log(indicador_escola, escola.cod, indicador_escola, selectedIndicador,tier_indicador, valor_indicador);
        
        if(escola.lat != null && escola.lon != null)
            L.marker([escola.lat, escola.lon], {icon: icone.marker}).bindPopup(`<b>${escola.nome}</b><br>codigo: ${escola.cod}<br>rede: ${escola.rede}<br>valor indicador: ${valor_indicador}`).addTo(markersLayer);
    });
}

var map = L.map('map');
var markersLayer = L.layerGroup().addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

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