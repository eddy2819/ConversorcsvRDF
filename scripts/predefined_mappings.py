import pandas as pd
import json
from typing import Dict, List, Any, Optional, Tuple
import re


class PredefinedMappings:
    def __init__(self):
        self.templates = {
            "personas": {
                "name": "Plantilla: Personas",
                "description": "Mapeo optimizado para datos de personas",
                "mappings": {
                    "name": {"rdfProperty": "http://xmlns.com/foaf/0.1/name", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "email": {"rdfProperty": "http://xmlns.com/foaf/0.1/email", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "age": {"rdfProperty": "http://xmlns.com/foaf/0.1/age", "dataType": "http://www.w3.org/2001/XMLSchema#integer"},
                    "city": {"rdfProperty": "http://schema.org/addressLocality", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "phone": {"rdfProperty": "http://xmlns.com/foaf/0.1/phone", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "company": {"rdfProperty": "http://xmlns.com/foaf/0.1/organization", "dataType": "http://www.w3.org/2001/XMLSchema#string"}
                }
            },
            "general": {
                "name": "Plantilla: General",
                "description": "Mapeo genérico para cualquier tipo de datos",
                "mappings": {
                    "id": {"rdfProperty": "http://schema.org/identifier", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "name": {"rdfProperty": "http://www.w3.org/2000/01/rdf-schema#label", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "description": {"rdfProperty": "http://purl.org/dc/terms/description", "dataType": "http://www.w3.org/2001/XMLSchema#string"},
                    "date": {"rdfProperty": "http://schema.org/dateCreated", "dataType": "http://www.w3.org/2001/XMLSchema#date"},
                    "url": {"rdfProperty": "http://schema.org/url", "dataType": "http://www.w3.org/2001/XMLSchema#anyURI"}
                }
            }
        }

    def get_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        return self.templates.get(template_name)

    def get_all_templates(self) -> Dict[str, Dict[str, Any]]:
        return self.templates

    def auto_map_columns(self, headers: List[str], template_name: str = "general") -> Dict[str, Dict[str, str]]:
        template = self.get_template(template_name)
        if not template:
            return {}

        auto_mapping = {}
        template_mappings = template["mappings"]

        for header in headers:
            normalized_header = self._normalize_column_name(header)

            if normalized_header in template_mappings:
                auto_mapping[header] = {
                    **template_mappings[normalized_header],
                    "isAutoMapped": True,
                    "confidence": 1.0
                }
                continue

            best_match = self._find_best_match(normalized_header, template_mappings)
            if best_match:
                auto_mapping[header] = {
                    **template_mappings[best_match["key"]],
                    "isAutoMapped": True,
                    "confidence": best_match["confidence"]
                }

        return auto_mapping

    def suggest_template(self, headers: List[str]) -> str:
        template_scores = {}

        for template_name, template in self.templates.items():
            score = 0
            template_mappings = template["mappings"]

            for header in headers:
                normalized_header = self._normalize_column_name(header)

                if normalized_header in template_mappings:
                    score += 2
                    continue

                best_match = self._find_best_match(normalized_header, template_mappings)
                if best_match and best_match["confidence"] > 0.6:
                    score += best_match["confidence"]

            template_scores[template_name] = score / len(headers) if headers else 0

        best_template = max(template_scores.items(), key=lambda x: x[1])
        return best_template[0] if best_template[1] > 0.3 else "general"

    def _normalize_column_name(self, column_name: str) -> str:
        normalized = column_name.lower().strip()
        normalized = re.sub(r'[^a-z0-9_]', '_', normalized)
        normalized = re.sub(r'_+', '_', normalized)
        return normalized.strip('_')

    def _find_best_match(self, column_name: str, template_mappings: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        best_match = None
        best_confidence = 0.0

        for template_key in template_mappings.keys():
            confidence = self._calculate_similarity(column_name, template_key)
            if confidence > best_confidence and confidence > 0.6:
                best_match = {"key": template_key, "confidence": confidence}
                best_confidence = confidence

        return best_match

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        str1, str2 = str1.lower(), str2.lower()

        if str1 == str2:
            return 1.0
        if str1 in str2 or str2 in str1:
            return 0.8

        words1 = set(str1.split('_'))
        words2 = set(str2.split('_'))

        intersection = words1 & words2
        return len(intersection) / max(len(words1), len(words2)) if intersection else 0.0


def get_auto_mapping(headers: List[str], template_name: str = None) -> Dict[str, Any]:
    mapper = PredefinedMappings()

    if not template_name:
        template_name = mapper.suggest_template(headers)

    auto_mapping = mapper.auto_map_columns(headers, template_name)
    mapped_count = len(auto_mapping)
    high_confidence = sum(1 for m in auto_mapping.values() if m.get("confidence", 0) > 0.8)

    return {
        "mapping": auto_mapping,
        "template_used": template_name,
        "template_info": mapper.get_template(template_name),
        "statistics": {
            "total_columns": len(headers),
            "mapped_columns": mapped_count,
            "unmapped_columns": len(headers) - mapped_count,
            "high_confidence_mappings": high_confidence,
            "mapping_percentage": (mapped_count / len(headers)) * 100 if headers else 0
        },
        "available_templates": list(mapper.templates.keys())
    }


def map_csv_file(csv_path: str, template_name: str = None) -> Dict[str, Any]:
    df = pd.read_csv(csv_path, nrows=1)
    headers = df.columns.tolist()
    return get_auto_mapping(headers, template_name)


def save_mapping_to_json(mapping_result: Dict[str, Any], output_path: str):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mapping_result, f, indent=2, ensure_ascii=False)


# ========= EJEMPLO DE USO =========
if __name__ == "__main__":
    csv_file_path = "tu_archivo.csv"  # Cambia esto al path real
    result = map_csv_file(csv_file_path)

    print(f"🔎 Plantilla sugerida: {result['template_used']}")
    print(f"📊 Columnas mapeadas: {result['statistics']['mapped_columns']} / {result['statistics']['total_columns']}")
    print(f"✅ Porcentaje de mapeo: {result['statistics']['mapping_percentage']:.1f}%")

    print("\n🧭 Mapeo automático:")
    for col, data in result["mapping"].items():
        print(f"  {col} -> {data['rdfProperty']} (confianza: {data.get('confidence', 'N/A')})")

    # Guardar el resultado como JSON
    save_mapping_to_json(result, "resultado_mapeo.json")
