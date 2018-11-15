# co-xslt

## Présentation

Le module `co-xslt` est un module de la chaine de traitement Conditor permettant de transformer un fichier XML et de lui appliquer une transformation XSL. Ce module se base sur le dépot `conditor-project/tei-conditor` pour lui fournir les fichiers XSL pour les différentes transformations XSL afin d'avoir une sortie en TEI.

## Fonctionnement

### Structure d'entrée

Les champs requis dans le JSON d'entrée sont les suivants :

```json
{
  "originDocPath": "test/dataset/pubmed/pubmed-11748933.xml",
}
```

### Structure de sortie

Un champ `teiDocPath` est créé contenant le chemin du chemin vers le fichier xml TEI.

```json
{
  "originDocPath": "test/dataset/pubmed/pubmed-11748933.xml",
  "teiDocPath": "/home/rmeja/Dev/conditor/co-xslt/test/dataset/pubmed/pubmed-11748933.tei"
}
```