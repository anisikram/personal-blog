---
title: "Comment fonctionne HashMap et HashSet en Java"
date: 2026-06-06
description: Comprendre HashMap et HashSet pour mieux les utiliser
author: Anis Ikram
image: /hashmap-hashset.png
---
Aujourd'hui je vous propose de plonger dans le fonctionnement de deux des collections les plus utilisées dans le monde Java. En effet lors de plusieurs discussions et entretiens, je me suis rendu compte que leur fonctionnement intrinsèque était parfois mal compris par certains développeurs. Pourquoi ne pas écrire un article pour éclaircir tout cela ? 

## Introduction 
Ces deux collections du ***Java Collection Framework*** sont **non ordonnées**, cela signifie que l'ordre d'insertion n'est pas conservé et qu'aucun tri n'est appliqué par défaut. Pire encore, après une insertion l'ordre interne de la collection peut être complètement réorganisé du fait de certaines caractéristiques techniques que nous allons voir ensuite. 

Un point crucial à noter : contrairement aux listes, **ces collections ne possèdent pas d'index**. Vous ne pouvez pas demander "l'élément à la position 5", car la notion de position n'y existe pas.

Pourquoi utilise-t-on ces collections  ?

Bien qu'elles n'aient aucune notion d'ordre, l'utilisation d'HashSet & HashMap est principalement motivée par une chose : **la vitesse**.
Là où d'autres collections comme `LinkedList` ou `ArrayList` permettent de vérifier une présence ou de récupérer une donnée en temps $O(n)$ puisqu'il faut parcourir toute la collection (dans le pire des cas), HashMap et HashSet promettent de faire la même chose en temps $O(1)$. Sur des gros volumes de données, la différence peut être colossale : là où les listes risquent de mettre plusieurs secondes à trouver une donnée, HashMap et HashSet répondent instantanément.

HashSet implémente l'interface Set : il ne contient que des objets uniques. Pour vérifier la présence d'un objet dans ce dernier (l'API `Set::contains`), il faut lui fournir un objet identique (**equals**). De fait, c'est l'outil idéal pour gérer des listes d'exclusion ou s'assurer qu'un traitement n'est pas effectué deux fois sur la même donnée.

La `HashMap` implémente l'interface `Map`. Elle stocke des couples **clé-valeur** (souvent appelés **tuples** ou **entry**). On l'utilise comme un dictionnaire : on fournit une clé (le mot) pour obtenir instantanément la valeur associée (la définition). C'est la structure de référence dès que l'on a besoin d'associer deux informations entre elles avec un accès rapide. Elle est très souvent appelée "dictionnaire" dans d'autres langages comme Python ou Smalltalk (pour les plus vieux).

Maintenant que les présentations sont faites, regardons de plus près les mécanismes derrière ces performances magiques.

## L'analogie de la rangée de tiroirs

Imaginez un instant que vous travailliez dans un bureau de poste où le courrier est rangé dans des gigantesques colonnes de tiroirs par ordre d'arrivée de manière séquentielle (comme une liste classique). Un client arrive pour vous demander son courrier. Afin de le retrouver, vous n'avez d'autre choix que de parcourir l'ensemble des tiroirs et vérifier chaque courrier jusqu'à tomber sur le bon. C'est la recherche séquentielle que l'on utilise en parcourant des listes par exemple, elle a un temps algorithmique $O(n)$ comme nous l'avons déjà vu où $n$ peut être très très grand. 

Maintenant optimisons tout cela, vous avez été embauché pour optimiser les process au sein du bureau de poste. La recherche de courrier prenant trop de temps aux employés, vous cherchez une solution. Vous décidez d'étiqueter chacun des 100 tiroirs du bureau de poste de 1 à 100 mais pour distribuer le courrier parmi ces 100 tiroirs, vous choisissez de calculer un code en fonction du nom du destinataire.
Par exemple en faisant la somme des positions des lettres de son nom dans l'alphabet : "Anis" donnerait donc $1 + 14 + 9 + 19 = 44$. Mais pour être sûr qu'aucun nom ne dépasse les 100 (le nombre de tiroirs), on applique une petite opération mathématique pour réduire le résultat $44\ \%\ 100 = 44$ .
Le courrier d'Anis sera systématiquement rangé et retrouvé dans le tiroir 44. L'employé n'aura plus qu'à faire ce simple calcul et ouvrir un seul tiroir, optimisant drastiquement le temps de recherche.
C'est ce qu'on appelle un accès direct. Vous noterez ici que, peu importe le nombre de clients, de courriers et de tiroirs, l'employé n'en ouvrira toujours qu'un seul, garantissant un temps constant moyen, donc $O(1)$.

Ce système d'étiquette calculée est le principe fondamental de la **table de hachage** (_Hash Table_), la structure de données qui se cache au cœur de nos `HashMap` et `HashSet`. Son but ultime est de prendre une donnée (votre clé), de la transformer en un index précis, et de vous donner un accès instantané à la case mémoire correspondante.

Mais comment Java calcule-t-il cette fameuse étiquette ? C'est là qu'entrent en jeu deux méthodes incontournables que vous avez surement déjà rencontrées...

## Le contrat : `hashCode()` &  `equals()`

Toutes les instances d'une classe en Java héritent implicitement de la classe `Object`. Parmi les méthodes de cette classe, on retrouve les méthodes hashCode() &  equals() que toute classe Java peut redéfinir.  À quoi servent-elles ?

- `hashCode()` :  C'est une fonction de hachage. Elle va retourner un entier sur 32 bits en fonction des propriétés de l'objet afin de permettre de l'identifier rapidement dans un ensemble (HashMap & HashSet par exemple). C'est l'équivalent de nos étiquettes sur les tiroirs si on reprend l'analogie du bureau de poste.
- `equals()` : Cette fonction permet d'indiquer si un objet "est égal" à un autre. C'est la vérification du nom sur le courrier dans le tiroir si on reprend l'analogie du bureau de poste.

Si vous ne redéfinissez pas ces méthodes, l'implémentation par défaut de la classe Object sera utilisée : 
 - `hashCode()`: Retournera un nombre généré par la JVM, généralement dérivé de l'identité de l'objet et stable durant son cycle de vie. Il sera ensuite stocké dans l'en-tête de l'objet (une zone spéciale dans l'espace mémoire occupé par l'objet qui est utile à la JVM). On parle d'un "Identity hashCode".
 - `equals()` : Ne vérifiera pas une égalité par valeur mais comparera les adresses mémoires des objets pour retourner `true` si c'est la même instance de la même façon. On parle là aussi d'une comparaison d'identité en opposition à l'égalité qui se base sur les champs d'un objet.

Ces deux méthodes sont soumises à un contrat au sein de la JVM, si vous les redéfinissez, vous vous devez de respecter certaines règles pour garantir le bon fonctionnement des collections : 
- Deux objets `equals()` doivent avoir le même `hashCode()`. L'inverse n'est pas forcément vrai : deux objets inégaux peuvent avoir le même `hashCode()` même s'il est mieux que ça ne soit jamais le cas (on verra pourquoi par la suite). 
- Un objet doit avoir le même `hashCode()` tout au long de son cycle de vie.

En règle générale, lors de la redéfinition de ces méthodes, il est bon de se baser sur les mêmes propriétés pour la génération du `hashCode()` et la comparaison dans `equals()`.
Les **records** redéfinissent automatiquement ces méthodes en se basant sur chacun de leurs composants car on estime que leur identité est définie par l'ensemble de leurs propriétés. Leur caractère immutable garantit que `hashCode()`générera toujours la même valeur  pour une même instance. 

Si on y réfléchit bien ces règles assurent le bon fonctionnement de notre système. Reprenons notre analogie du bureau de poste, imaginez si on recevait des copies d'un courrier pour un même destinataire et qu'ils étaient rangés dans des tiroirs différents. ou encore que le courrier pourrait changer de destinataire tout en restant rangé dans le mauvais tiroir en conséquence. On ne le retrouverait pas : `map.get()` retournerait `null`. Et c'est sans parler de la fuite mémoire : l'objet reste référencé dans la HashMap, donc inéligible au garbage collector, alors même qu'il est devenu inaccessible. Il est important que la clé ne change pas de façon à ne pas générer un `hashCode()` différent et à continuer à être `equals()`. On préférera donc  toujours des clés immutables (c'est également le cas pour les éléments contenus dans HashSet).

Maintenant qu'on a appréhendé les concepts de base, soulevons le capot de HashMap pour voir ce qui s'y passe en détail.

## Anatomie d'une HashMap : Sous le capot

Vous l'avez sans doute déjà compris mais nos colonnes de tiroirs représentent notre collection : `HashMap`. 
Mais comment cela s'organise dans le code ? 
En interne, l'implémentation repose sur un tableau où chaque cellule représente un tiroir dans notre fameux bureau de poste. On parle  alors d'un ***bucket*** (un panier) dans le jargon. Pourquoi un tableau ? Je ne rentrerai pas dans le détail ici (qui pourrait faire l'objet d'un article à part entière) mais les tableaux sont des espaces mémoire contigus qui permettent quelques optimisations du CPU dans ses accès à la mémoire. 
Dans chaque bucket (notre tiroir), on retrouve un nœud qui est le premier élément d'une liste chaînée.

```Java
static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        Node<K,V> next;
		...
}
```

Dans notre analogie du bureau de poste, je vous avais affirmé que pour retrouver le bon bucket on utilisait l'opération $\%$ (modulo) mais dans HashMap, il n'en est rien. Si vous regardez l'implémentation, voici comment ça fonctionne  :

Le nombre de buckets présents dans la collection est toujours une puissance de 2 et initialisé à 16 lors de sa construction. 
Après avoir calculé le `hashCode()` d'un objet, on obtient donc un entier sur 32 bits.
Prenons le code suivant : 256749 qui s'écrit $0000000000000011\ 1110101011101101$ en binaire.
Ensuite, on décale de 16 bits vers la droite pour ramener les bits de poids fort à la position des bits de poids faible : $h \mathbin{>>>} 16$, ce qui donne ce nouveau hash : $0000000000000000\ 0000000000000011$
Puis on fait un mélange de ces deux hash via l'opération $\wedge$ (XOR ou "OU EXCLUSIF" en bon français et `^` en Java) : 

$$
\begin{array}{r}
0000000000000011\ 1110101011101101 \\
\wedge\quad 0000000000000000\ 0000000000000011 \\
\hline
0000000000000011\ 1110101011101110
\end{array}
$$

Enfin on procède au masquage de tous les bits dont on n'a pas besoin car ici le nombre représenté est encore bien au-dessus du nombre de buckets dans notre collection. 
On va donc procéder au masquage de certains bits afin d'avoir une valeur en corrélation avec notre capacité :
$(n - 1) \mathbin{\&} h$ 
où $n$ est le nombre de buckets. Ici, $n = 16$ donc $n - 1 = 15$ soit $000\ldots001111$ en binaire.
L'opération binaire $\&$ ici compare un à un chaque bit des deux valeurs et ne garde le 1 que quand il y a un autre 1 en face : 

$$
\begin{array}{r}
0000000000000011\ 1110101011101110 \\
\mathbin{\&}\quad 0000000000000000\ 0000000000001111 \\
\hline
0000000000000000\ 0000000000001110
\end{array}
$$

ce qui équivaut à 14, notre objet se retrouvera donc dans le bucket à l'index 14.

Pourquoi une opération aussi complexe ? 

La première opération consiste à mélanger l'information contenue dans les bits de poids fort avec les bits de poids faible. Puisque si l'on faisait tout de suite le masquage avec un petit nombre de buckets (comme 16, où le masque est $1111$ en binaire), on ne prendrait en compte que les 4 derniers bits du `hashCode()`. On risquerait donc de se retrouver assez régulièrement avec des **valeurs différentes produisant le même index final, provoquant ainsi ce que l'on appelle des collisions.** Le décalage et le XOR forcent les bits de gauche (de poids fort) à influencer le résultat final, garantissant une meilleure répartition dans le tableau. Sans cela on aurait une mauvaise distribution des `hashCode()` par rapport aux buckets disponibles.

Procéder par opérations bit à bit est bien plus rapide : le processeur  les traite de manière quasi instantanée, contrairement à la division (derrière le modulo), l'une des opérations les plus lentes. 
Notez cependant que cela impose que le nombre de buckets soit toujours une puissance de 2 !

## Il est temps de vous dire la vérité
Vous noterez que tout au long de cet article, je n'ai parlé que de HashMap, en omettant HashSet. Alors qu'en est-il ? HashSet est en fait une ... HashMap ! 

En effet, Java réutilise l'implémentation de HashMap. Comme un Set ne stocke qu'une valeur, et non un couple clé-valeur, cette valeur est rangée à la place de la clé ; on utilise alors un objet placeholder comme valeur.

```
private static Object PRESENT = new Object();
``` 

C'est une réutilisation maligne de l'implémentation d'HashMap pour ne pas avoir à recoder toute la logique de hashing.
## Quand les tiroirs débordent : la gestion des collisions

Dans le chapitre sur `hashCode()`, j'avais précisé qu'il était possible que deux objets inégaux puissent générer un `hashCode()` identique. Comment la collection gère-t-elle ce genre de cas ?

### La liste chaînée

Comme on l'a vu précédemment chaque bucket contient en fait non pas un objet directement mais un nœud. Ces nœuds possèdent tous une référence vers l'élément suivant via l'attribut `next`. Ils composent ce qu'on appelle une liste chaînée (ou linked list en anglais). Dans les tiroirs de notre bureau de poste, c'est une file de courrier non trié.

Quand on veut ajouter un courrier dans un tiroir qui en contient déjà, on l'ajoute simplement au fond du tiroir à la fin de la file. Techniquement, ça correspond à une clé qui génère le même `hashCode()` que des éléments déjà présents : la collection trouve le bucket correspondant et parcourt la liste chaînée à partir du premier nœud, en suivant la référence `next` jusqu'au dernier élément où `next == null`. À ce moment, un nouveau nœud contenant notre couple clé-valeur est créé et référencé par le nœud précédent.

Pour la lecture, on défile les courriers dans le bon tiroir jusqu'à tomber sur le bon. À partir du bucket, on parcourt la liste chaînée pour trouver la clé égale (au sens de `equals`) à celle fournie en entrée afin de retourner la valeur du couple clé-valeur. Vous comprenez mieux maintenant pourquoi la JVM définit un contrat entre `equals()` et `hashCode()`. 

Cependant, comme vous pouvez le voir, si notre bucket contient beaucoup d'éléments, parcourir une liste chaînée peut s'avérer particulièrement long ($O(n)$) et faire s'effondrer les performances de notre collection. Mais qu'à cela ne tienne, les développeurs du JDK ont prévu le coup, nous allons maintenant voir comment.

### L'arbre rouge-noir

Dans le code de HashMap, on retrouve une constante nommée `int TREEIFY_THRESHOLD = 8`. Elle détermine à partir de quelle taille le bucket va procéder à son arbrification (_treeification_ en anglais). On passera donc d'une liste chaînée à un arbre comme structure de données dans un bucket. Pourquoi ?

Ça revient en fait à trier la file dans notre tiroir, on peut maintenant rechercher le courrier par ordre alphabétique ce qui est plus rapide. 
Un bucket trop grand est délétère pour les performances si on a une liste chaînée puisque pour l'insertion et la lecture, on a un temps algorithmique $O(n)$.  Tandis qu'un arbre binaire voit ces mêmes temps descendre à $O(\log(n))$. Cet arbre binaire est ce qu'on appelle un arbre rouge-noir. Sans entrer dans le détail, il se maintient équilibré de lui-même, ce qui l'empêche de dériver vers une forme proche d'une liste chaînée — et donc de retomber à des performances $O(n)$.

Cependant, ce n'est pas la seule condition à remplir. Il faut que la collection ait une **capacité minimale de 64** (définie par `MIN_TREEIFY_CAPACITY`) pour procéder à cette "treeification". Si cette capacité n'est pas atteinte, la `HashMap` préférera effectuer un simple **redimensionnement** (que l'on verra plus bas dans l'article) global plutôt que de complexifier un bucket localement.

Une troisième constante  intervient également : la `UNTREEIFY_THRESHOLD`. Elle détermine le moment où l'on repasse à une liste chaînée à la place d'un arbre binaire lorsque la taille du bucket diminue et ne justifie plus une structure en arbre. Cette valeur est fixée à **6**.

Un arbre binaire a besoin de comparer la valeur contenue dans chaque nœud afin de maintenir un ordre permettant la recherche dichotomique. Alors, comment les données sont-elles triées ?

À l'insertion, HashMap applique la cascade suivante :

1. On compare les valeurs générées par `hashCode()` (la valeur brute, sans mélange ni masque).
2. Si les `hashCode()` sont égaux et que les clés appartiennent à la même classe implémentant `Comparable`, on utilise `compareTo()`.
3. Sinon, on utilise un ordre de secours basé sur le nom de la classe et `System.identityhashCode()` (le fameux identity hashCode vu plus haut).

Ce 3ème cas garantit bien un ordre total et donc un arbre équilibré à l'insertion, mais il pose un problème à la **lecture**. Quand on cherche une clé via `get()`, l'arbre essaie de décider de quel côté descendre en comparant les `hashCode()`. Si plusieurs clés partagent le même `hashCode()` et ne sont pas Comparable, HashMap ne peut plus se fier à l'ordre de secours pour trancher (deux clés distinctes avec le même `hashCode()` peuvent se retrouver dans n'importe quelle branche selon l'ordre d'insertion). Elle est alors contrainte d'explorer les deux sous-arbres à la recherche d'une clé `equals()` à celle demandée, et les performances retombent vers  $O(n)$ dans le pire cas.

C'est pourquoi, sur un système critique, implémenter `Comparable` sur ses clés peut être intéressant. Mais avant cela, il faut d'abord se pencher sur la distribution des `hashCode()` pour éviter les collisions à la source.

## Performances 

### Le rôle crucial du `hashCode()`

Toute la performance d'une `HashMap` repose sur une chose : la qualité du `hashCode()` de nos clés (ou éléments pour un `HashSet`).

Si notre `hashCode()` est bien implémenté, les éléments sont répartis de manière homogène entre les buckets. Chaque tiroir ne contient que quelques éléments, qu'on parcourt en quelques itérations. C'est le meilleur cas.
    
À l'inverse, imaginons une méthode `hashCode()` qui retournerait une constante. L'ensemble des éléments finirait dans le même bucket, autrement dit, on rangerait tout notre courrier dans un seul tiroir.  La complexité de recherche deviendrait $O(n)$, comme une simple **liste chaînée**, on perd tout l'intérêt de notre collection. Une catastrophe ! 
        
Soigner son `hashCode()` n'est donc pas un détail cosmétique : c'est la condition pour que la HashMap tienne sa promesse de performance.

### Le Load Factor et le Redimensionnement dans la HashMap

Le **load factor** (facteur de charge) est le seuil de remplissage à partir duquel la HashMap décide qu'elle est trop pleine et qu'il est temps de s'agrandir.
Par défaut, cette valeur vaut **0,75**. Si le nombre d’entrées dépasse 75 % du nombre de buckets, un redimensionnement est déclenché.

$$\text{Seuil de déclenchement}$$
$$\text{Nombre d'entrées} > \text{Nombre de buckets} \times 0,75$$

Pour reprendre notre analogie, c'est comme si dès que 75 % de nos tiroirs étaient occupés, on déménageait tous les courriers dans une nouvelle salle fraîchement construite avec le double de tiroirs. Et ce déménagement coûte cher car il faut instancier un nouveau tableau d'une capacité double de l'initiale et redistribuer tous les éléments existants dans les nouveaux buckets. Autant vous dire qu'on veut éviter de faire ça tous les quatre matins.
    
Donc si on connaît le nombre maximal de courriers qu'on va recevoir, il est préférable d'instancier la `HashMap` avec une capacité initiale calculée pour éviter les redimensionnements successifs :

$$\text{Capacité à renseigner} = \frac{\text{Nombre d'éléments attendus}}{\text{Load Factor}} + 1$$

Pas besoin de donner une puissance de 2 précise au constructeur : `HashMap(int initialCapacity)`. Il fait le travail pour nous en calculant la puissance de 2 supérieure à la capacité passée en argument.

Il reste possible de paramétrer manuellement le _load factor_ via le constructeur :  `HashMap(int initialCapacity, float loadFactor)`. Cependant, cela est déconseillé sauf cas d'usage très spécifique, car un mauvais réglage impacte directement soit la consommation mémoire, soit les performances de recherche.

### Concurrence

Ces collections ne sont pas **thread-safe**. Les utiliser dans un environnement les exposant à des accès concurrents est proscrit si vous ne voulez pas déclencher une avalanche de bugs. Une autre implémentation pour ce cas d'usage existe `ConcurrentHashMap` préférable à un `SynchronizedMap` car plus performant (ça pourrait faire l'objet d'un autre article ?).

## Conclusion

Derrière l'apparente facilité qu'offre l'utilisation de ces collections se cachent des mécanismes complexes pour nous garantir les performances attendues.  Il n'est certes pas nécessaire de maîtriser l'intégralité de l'implémentation mais il reste important de comprendre certaines mécaniques pour garantir les performances de ces collections lors de leur utilisation, notamment la nécessité d'avoir un `hashCode()` de qualité, de respecter le contrat entre `equals()` et `hashCode()`, et  de penser à la capacité initiale pour les gros volumes. J'espère maintenant que grâce à moi, vous verrez les bureaux de poste différemment ! 

Si vous notez des coquilles sur cet article, n'hésitez pas à me contacter pour que je les corrige, je suis loin d'être omniscient et j'ai tenté de vulgariser au mieux. Je vous remercie d'avance !
