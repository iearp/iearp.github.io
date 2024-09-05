// data_cidades from data_cidades.js "cod","cod_estado","nome","is_parceiro","lat","lon"
// data_escolas from data_escolas.js "cod", "lat", "lon", "id_municipio", "cod_estado", "nome", "localizacao", "rede"
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
const tierFourColor = "#dc2626";
const tierThreeColor = "#ff6701";
const tierTwoColor = "#fde620";
const tierOneColor = "#54b400";
const tierNullColor = "#BFBEC5";

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
//when there is no value
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

function getSchoolsFromCity(
    selectedCity,
    selectedEtapa,
    selectedLocalizacao,
    selectedAno
) {

    const filteredSchoolsByCityCode = 
        data_escolas.filter(
            escola => escola.id_municipio == selectedCity
        );
    
    const filteredSchoolsByRede = 
        filteredSchoolsByCityCode.filter(
            escola => escola.rede == 'Municipal'
        );

    const filteredSchoolsByLocalizacao = (
        selectedLocalizacao === "Todas" ? filteredSchoolsByRede : 
            filteredSchoolsByRede.filter(
                escola => escola.localizacao == selectedLocalizacao
            )
        );

    let filteredSchoolsByEtapa = filteredSchoolsByLocalizacao
    if(selectedEtapa === "Anos iniciais") {
        filteredSchoolsByEtapa = filteredSchoolsByEtapa.filter(
            escola => (escola.has_fund_ai === "true" || getIndicadorForSchool(escola.id, selectedEtapa, selectedAno) != null)
        )
    } else if (selectedEtapa === "Anos finais") {
        filteredSchoolsByEtapa = filteredSchoolsByEtapa.filter(
            escola => (escola.has_fund_af === "true" || getIndicadorForSchool(escola.id, selectedEtapa, selectedAno) != null)
        )
    }
    //Since we dont have that info in the database, this is a quick fix for
    //  when the school was not registered in previous year having a grade that 
    //  it used to offer or something like that.
    
    
    return filteredSchoolsByEtapa;
}

function getIndicadorForSchool(cod_escola, etapa, ano) {
    return data_indicadores_escolas.filter(indicador => indicador.cod == cod_escola && indicador.ano == ano && indicador.etapa == etapa)?.pop()
}

function renderMap() {
    markersLayer.clearLayers();

    const selectedCity = 
        document.getElementById('menu-item-cidade').value;

    const selectedIndicador = 
        document.getElementById('menu-item-indicador').value;

    const selectedAno = 
        document.getElementById('menu-item-ano').value;

    const selectedEtapa = 
        document.getElementById('menu-item-etapa').value;

    const selectedLocalizacao = 
        document.getElementById('menu-item-localizacao').value;

    const filteredCity = 
        data_cidades.find(
            cidade => cidade.cod == selectedCity
        );

    const filteredSchools = getSchoolsFromCity(
        selectedCity,
        selectedEtapa,
        selectedLocalizacao,
        selectedAno
    );

    filteredSchools.forEach(function(escola) {
        const indicador_escola = 
            getIndicadorForSchool(
                escola.id, 
                selectedEtapa, 
                selectedAno
            );
        
        let tier_indicador = 0, valor_indicador = "N/A";
        let icone;
        
        if(indicador_escola != undefined) {
            switch(selectedIndicador) {
                case "pca":
                    tier_indicador = indicador_escola.tier_pc ?? 0;
                    valor_indicador = indicador_escola.pc ?? 0;
                    break;
                case "lp":
                    tier_indicador = indicador_escola.tier_lp ?? 0 ;
                    valor_indicador = indicador_escola.lp ?? 0;
                    break;
                case "mat":
                    tier_indicador = indicador_escola.tier_mat ?? 0;
                    valor_indicador = indicador_escola.mat ?? 0;
                    break;
            }
        }
        
        switch(tier_indicador) {
            case 0:
                icone = TierNull;
                break;
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

        console.log(indicador_escola, escola.id, indicador_escola, selectedIndicador,tier_indicador, valor_indicador);

        map.setView([filteredCity.lat, filteredCity.lon], map.getZoom());
        
        if(escola.coordenadas_latitude != null && escola.coordenadas_longitude != null && icone != null)
            L.marker(
                [escola.coordenadas_latitude, escola.coordenadas_longitude], 
                {icon: icone.marker}
            ).bindPopup(
                `<b>${escola.nome}</b><br>
                codigo: ${escola.id}<br>
                rede: ${escola.rede}<br>
                valor indicador: ${valor_indicador}` 
            ).addTo(markersLayer);
    });
}

var map = L.map('map');
var markersLayer = L.layerGroup().addTo(map);
map.setZoom(12);
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

    map.removeControl(caption);

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
})});
