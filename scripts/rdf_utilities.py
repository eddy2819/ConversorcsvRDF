from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, RDFS, XSD
import json
from typing import Dict, List, Any, Optional

class RDFUtilities:
    """
    Utilidades adicionales para trabajar con datos RDF
    """
    
    @staticmethod
    def query_triplets(triplets: List[Dict[str, str]], sparql_query: str) -> List[Dict[str, str]]:
        """
        Ejecuta una consulta SPARQL simple sobre las tripletas
        """
        # Crear grafo temporal
        g = Graph()
        
        for triplet in triplets:
            subject = URIRef(triplet['subject'])
            predicate = URIRef(triplet['predicate'])
            
            # Determinar si el objeto es URI o Literal
            obj_str = triplet['object']
            if obj_str.startswith('http://') or obj_str.startswith('https://'):
                obj = URIRef(obj_str)
            else:
                datatype = triplet.get('dataType', str(XSD.string))
                obj = Literal(obj_str, datatype=URIRef(datatype))
            
            g.add((subject, predicate, obj))
        
        # Ejecutar consulta
        results = []
        try:
            qres = g.query(sparql_query)
            for row in qres:
                result_dict = {}
                for i, var in enumerate(qres.vars):
                    result_dict[str(var)] = str(row[i])
                results.append(result_dict)
        except Exception as e:
            print(f"Error en consulta SPARQL: {e}")
        
        return results
    
    @staticmethod
    def generate_statistics(triplets: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Genera estadísticas sobre las tripletas RDF
        """
        if not triplets:
            return {}
        
        subjects = set(t['subject'] for t in triplets)
        predicates = set(t['predicate'] for t in triplets)
        objects = set(t['object'] for t in triplets)
        datatypes = set(t.get('dataType', '') for t in triplets if t.get('dataType'))
        
        # Contar frecuencias de predicados
        predicate_counts = {}
        for triplet in triplets:
            pred = triplet['predicate']
            predicate_counts[pred] = predicate_counts.get(pred, 0) + 1
        
        # Contar tipos de datos
        datatype_counts = {}
        for triplet in triplets:
            dt = triplet.get('dataType', 'unknown')
            datatype_counts[dt] = datatype_counts.get(dt, 0) + 1
        
        return {
            'total_triplets': len(triplets),
            'unique_subjects': len(subjects),
            'unique_predicates': len(predicates),
            'unique_objects': len(objects),
            'unique_datatypes': len(datatypes),
            'predicate_frequency': predicate_counts,
            'datatype_frequency': datatype_counts,
            'avg_triplets_per_subject': len(triplets) / len(subjects) if subjects else 0
        }
    
    @staticmethod
    def export_formats(triplets: List[Dict[str, str]]) -> Dict[str, str]:
        """
        Exporta las tripletas en diferentes formatos RDF
        """
        g = Graph()
        
        # Agregar tripletas al grafo
        for triplet in triplets:
            subject = URIRef(triplet['subject'])
            predicate = URIRef(triplet['predicate'])
            
            obj_str = triplet['object']
            if obj_str.startswith('http://') or obj_str.startswith('https://'):
                obj = URIRef(obj_str)
            else:
                datatype = triplet.get('dataType', str(XSD.string))
                obj = Literal(obj_str, datatype=URIRef(datatype))
            
            g.add((subject, predicate, obj))
        
        return {
            'turtle': g.serialize(format='turtle'),
            'rdf_xml': g.serialize(format='xml'),
            'n_triples': g.serialize(format='nt'),
            'json_ld': g.serialize(format='json-ld'),
            'n3': g.serialize(format='n3')
        }
    
    @staticmethod
    def validate_uris(triplets: List[Dict[str, str]]) -> Dict[str, List[str]]:
        """
        Valida las URIs en las tripletas
        """
        invalid_subjects = []
        invalid_predicates = []
        invalid_objects = []
        
        for triplet in triplets:
            # Validar sujeto
            if not triplet['subject'].startswith('http://') and not triplet['subject'].startswith('https://'):
                invalid_subjects.append(triplet['subject'])
            
            # Validar predicado
            if not triplet['predicate'].startswith('http://') and not triplet['predicate'].startswith('https://'):
                invalid_predicates.append(triplet['predicate'])
            
            # Validar objeto si es URI
            obj = triplet['object']
            if obj.startswith('http://') or obj.startswith('https://'):
                try:
                    URIRef(obj)
                except:
                    invalid_objects.append(obj)
        
        return {
            'invalid_subjects': list(set(invalid_subjects)),
            'invalid_predicates': list(set(invalid_predicates)),
            'invalid_objects': list(set(invalid_objects))
        }

# Función para generar consultas SPARQL comunes
def generate_common_queries() -> Dict[str, str]:
    """
    Genera consultas SPARQL comunes para explorar los datos
    """
    return {
        'all_subjects': """
            SELECT DISTINCT ?subject
            WHERE {
                ?subject ?predicate ?object .
            }
        """,
        'all_predicates': """
            SELECT DISTINCT ?predicate
            WHERE {
                ?subject ?predicate ?object .
            }
        """,
        'predicate_count': """
            SELECT ?predicate (COUNT(*) as ?count)
            WHERE {
                ?subject ?predicate ?object .
            }
            GROUP BY ?predicate
            ORDER BY DESC(?count)
        """,
        'subjects_with_multiple_properties': """
            SELECT ?subject (COUNT(DISTINCT ?predicate) as ?prop_count)
            WHERE {
                ?subject ?predicate ?object .
            }
            GROUP BY ?subject
            HAVING (COUNT(DISTINCT ?predicate) > 1)
            ORDER BY DESC(?prop_count)
        """
    }

if __name__ == "__main__":
    # Ejemplo de uso de las utilidades
    sample_triplets = [
        {
            'subject': 'http://example.org/person1',
            'predicate': 'http://xmlns.com/foaf/0.1/name',
            'object': 'Juan Pérez',
            'dataType': 'http://www.w3.org/2001/XMLSchema#string'
        },
        {
            'subject': 'http://example.org/person1',
            'predicate': 'http://xmlns.com/foaf/0.1/age',
            'object': '30',
            'dataType': 'http://www.w3.org/2001/XMLSchema#integer'
        }
    ]
    
    # Generar estadísticas
    stats = RDFUtilities.generate_statistics(sample_triplets)
    print("Estadísticas:", json.dumps(stats, indent=2))
    
    # Validar URIs
    validation = RDFUtilities.validate_uris(sample_triplets)
    print("Validación de URIs:", validation)
    
    # Exportar formatos
    formats = RDFUtilities.export_formats(sample_triplets)
    print("Formato Turtle:", formats['turtle'])
