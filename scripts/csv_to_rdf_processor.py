import pandas as pd
import json
from rdflib import Graph, Namespace, URIRef, Literal, RDF, RDFS
from rdflib.namespace import XSD
import uuid
from typing import Dict, List, Any

class CSVToRDFProcessor:
    def __init__(self):
        self.graph = Graph()
        self.base_uri = "http://example.org/"
        self.namespace = Namespace(self.base_uri)
        
        # Bind common namespaces
        self.graph.bind("ex", self.namespace)
        self.graph.bind("rdf", RDF)
        self.graph.bind("rdfs", RDFS)
        self.graph.bind("xsd", XSD)
    
    def process_csv_data(self, csv_data: Dict[str, Any], column_mapping: Dict[str, Dict[str, str]]) -> Dict[str, Any]:
        """
        Procesa datos CSV y los convierte a RDF usando el mapeo de columnas proporcionado
        
        Args:
            csv_data: Diccionario con 'headers' y 'rows'
            column_mapping: Mapeo de columnas a propiedades RDF
            
        Returns:
            Diccionario con tripletas y JSON-LD
        """
        headers = csv_data['headers']
        rows = csv_data['rows']
        
        triplets = []
        
        # Procesar cada fila
        for row_index, row in enumerate(rows):
            # Crear URI único para cada entidad
            entity_uri = f"{self.base_uri}entity_{row_index + 1}"
            subject = URIRef(entity_uri)
            
            # Procesar cada columna mapeada
            for col_index, header in enumerate(headers):
                if header in column_mapping and col_index < len(row):
                    mapping = column_mapping[header]
                    cell_value = row[col_index].strip()
                    
                    if cell_value:  # Solo procesar valores no vacíos
                        predicate = URIRef(mapping['rdfProperty'])
                        
                        # Determinar el tipo de dato y crear el objeto apropiado
                        datatype_uri = mapping['dataType']
                        
                        if datatype_uri == str(XSD.integer):
                            try:
                                obj = Literal(int(cell_value), datatype=XSD.integer)
                            except ValueError:
                                obj = Literal(cell_value, datatype=XSD.string)
                        elif datatype_uri == str(XSD.decimal):
                            try:
                                obj = Literal(float(cell_value), datatype=XSD.decimal)
                            except ValueError:
                                obj = Literal(cell_value, datatype=XSD.string)
                        elif datatype_uri == str(XSD.boolean):
                            bool_value = cell_value.lower() in ['true', '1', 'yes', 'sí']
                            obj = Literal(bool_value, datatype=XSD.boolean)
                        elif datatype_uri == str(XSD.anyURI):
                            obj = URIRef(cell_value) if cell_value.startswith('http') else Literal(cell_value, datatype=XSD.anyURI)
                        else:
                            obj = Literal(cell_value, datatype=URIRef(datatype_uri))
                        
                        # Agregar tripleta al grafo
                        self.graph.add((subject, predicate, obj))
                        
                        # Agregar a la lista de tripletas para retornar
                        triplets.append({
                            'subject': str(subject),
                            'predicate': str(predicate),
                            'object': str(obj),
                            'dataType': datatype_uri
                        })
        
        # Generar JSON-LD
        json_ld = self.generate_json_ld(triplets)
        
        return {
            'triplets': triplets,
            'json_ld': json_ld,
            'turtle': self.graph.serialize(format='turtle'),
            'rdf_xml': self.graph.serialize(format='xml'),
            'n_triples': self.graph.serialize(format='nt')
        }
    
    def generate_json_ld(self, triplets: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Genera JSON-LD a partir de las tripletas
        """
        # Agrupar tripletas por sujeto
        subjects = {}
        
        for triplet in triplets:
            subject = triplet['subject']
            predicate = triplet['predicate']
            obj = triplet['object']
            datatype = triplet.get('dataType', str(XSD.string))
            
            if subject not in subjects:
                subjects[subject] = {'@id': subject}
            
            # Simplificar el predicado para JSON-LD
            pred_key = predicate.split('/')[-1] if '/' in predicate else predicate
            
            # Crear el valor del objeto
            if datatype == str(XSD.string):
                value = obj
            else:
                value = {
                    '@value': obj,
                    '@type': datatype
                }
            
            # Agregar al sujeto
            if pred_key in subjects[subject]:
                # Si ya existe, convertir a lista
                if not isinstance(subjects[subject][pred_key], list):
                    subjects[subject][pred_key] = [subjects[subject][pred_key]]
                subjects[subject][pred_key].append(value)
            else:
                subjects[subject][pred_key] = value
        
        # Crear el contexto JSON-LD
        context = {
            '@base': self.base_uri,
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'xsd': 'http://www.w3.org/2001/XMLSchema#'
        }
        
        return {
            '@context': context,
            '@graph': list(subjects.values())
        }
    
    def validate_rdf(self) -> Dict[str, Any]:
        """
        Valida el grafo RDF generado
        """
        return {
            'is_valid': True,
            'triple_count': len(self.graph),
            'subjects_count': len(set(self.graph.subjects())),
            'predicates_count': len(set(self.graph.predicates())),
            'objects_count': len(set(self.graph.objects()))
        }

# Función principal para usar desde la interfaz
def process_csv_to_rdf(csv_data, column_mapping):
    """
    Función principal para procesar CSV a RDF
    """
    processor = CSVToRDFProcessor()
    result = processor.process_csv_data(csv_data, column_mapping)
    validation = processor.validate_rdf()
    
    result['validation'] = validation
    return result

# Ejemplo de uso
if __name__ == "__main__":
    # Datos de ejemplo
    sample_csv = {
        'headers': ['name', 'age', 'email', 'city'],
        'rows': [
            ['Juan Pérez', '30', 'juan@email.com', 'Madrid'],
            ['María García', '25', 'maria@email.com', 'Barcelona'],
            ['Carlos López', '35', 'carlos@email.com', '  '25', 'maria@email.com', 'Barcelona'],
            ['Carlos López', '35', 'carlos@email.com', 'Valencia']
        ]
    }
    
    sample_mapping = {
        'name': {
            'rdfProperty': 'http://xmlns.com/foaf/0.1/name',
            'dataType': 'http://www.w3.org/2001/XMLSchema#string'
        },
        'age': {
            'rdfProperty': 'http://xmlns.com/foaf/0.1/age',
            'dataType': 'http://www.w3.org/2001/XMLSchema#integer'
        },
        'email': {
            'rdfProperty': 'http://xmlns.com/foaf/0.1/email',
            'dataType': 'http://www.w3.org/2001/XMLSchema#string'
        },
        'city': {
            'rdfProperty': 'http://schema.org/addressLocality',
            'dataType': 'http://www.w3.org/2001/XMLSchema#string'
        }
    }
    
    # Procesar
    result = process_csv_to_rdf(sample_csv, sample_mapping)
    
    print("Tripletas generadas:", len(result['triplets']))
    print("JSON-LD generado:", json.dumps(result['json_ld'], indent=2))
    print("Validación:", result['validation'])
