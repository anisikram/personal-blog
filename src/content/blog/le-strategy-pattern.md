---
title: "Le Strategy Pattern"
date: 2025-09-27
description: "Qu'est ce que le pattern strategy ? Comment & quand l'utiliser ? "
author: "Anis Ikram"
image: "/strategy.png"
---

# Introduction

Dans la suite de cette série d’articles sur les design patterns, nous allons aborder le **Strategy pattern** (ou stratégie en bon français). Ce pattern appartient à la famille des patrons de conception comportementaux puisqu’il permet de sélectionner le comportement d’un objet (ou une stratégie, d’où le nom de ce pattern) durant l’exécution (*runtime*).

---

En effet, lorsqu’on débute, on a souvent l’habitude d’utiliser l’héritage et le polymorphisme pour implémenter et surcharger des comportements. Prenons, par exemple, le cas d’une classe `Animal` qui implémente une méthode `avancer()` :

```java
abstract class Animal {
    private String name;
    abstract void avancer();
}

class Oiseau extends Animal {
    public Oiseau(String name){
        this.name = name;
    }

    @Override
    public void avancer(){
        System.out.println("Moi je vole...");
    }
}

class Main {
    public static void main(){
        Animal oiseau = new Oiseau("Oiseau");
        oiseau.avancer();
        //Output: "Moi je vole..."
    }
}
```

Ici, la classe `Oiseau` hérite de la classe abstraite `Animal` pour surcharger le comportement `avancer()` et permettre aux objets de la classe Oiseau de « voler ».

Quel est le problème avec le code ci‑dessus ? Imaginons qu’on nous demande de pouvoir faire se déplacer tous types d’animaux. Avec cette approche, nous nous retrouverions très vite avec un nombre incalculable de sous‑classes héritant de la classe `Animal` pour chaque animal sur Terre, ce qui serait ingérable à long terme pour diverses raisons évidentes. En effet si l’héritage favorise la réutilisation du code, il peut conduire à une structure rigide difficile à maintenir car il induit un couplage fort entre les classes.

Mais il y a aussi une autre contrainte importante dans ce code qui ne saute pas tout de suite aux yeux : le comportement d’un oiseau est figé à la compilation. Il est impossible pour les objets de cette classe d’avancer autrement qu’en volant. Une fois le programme lancé, il ne sera plus jamais possible de faire marcher notre oiseau.

Cet exemple illustre bien le principe de la **Composition over inheritance** en POO, qui consiste à favoriser la composition d’un objet par un autre afin d’implémenter un nouveau comportement, plutôt que d’utiliser l’héritage. Cela permet de changer de comportement de manière dynamique pendant l’exécution de notre programme et d’ajouter des comportements sans modifier la classe de base. Ainsi, notre oiseau pourra marcher ! En faisant cela, on respecte l’un des principes SOLID : le principe *Ouvert/Fermé* qui stipule que le code doit être ouvert à l’extension et fermé à la modification.

Voici l’implémentation de notre classe Oiseau en utilisant ce pattern :

```java
interface Deplacement {
    void avancer();
}

class Marche implements Deplacement {
    @Override
    public void avancer(){
        System.out.println("Moi je marche...");
    }
}

class Vol implements Deplacement {
    @Override
    public void avancer(){
        System.out.println("Moi je vole...");
    }
}

class Animal {
    private String name;
    private Deplacement deplacement;

    public Animal(String name, Deplacement deplacement){
        this.name = name;
        this.deplacement = deplacement;
    }

    public void setDeplacement(Deplacement deplacement){
        this.deplacement = deplacement;
    }

    public void avancer(){
        this.deplacement.avancer();
    }
}

class Main {
    public static void main(){
        Animal oiseau = new Animal("Oiseau", new Vol());
        oiseau.avancer();
        //Output: "Moi je vole..."
        oiseau.setDeplacement(new Marche());
        oiseau.avancer();
        //Output: "Moi je marche..."
    }
}
```

L’interface `Deplacement` et ses implémentations regroupent nos **stratégies de déplacement**. C’est une famille d’algorithmes interchangeables dynamiquement grâce au polymorphisme. Notre classe `Animal` est désormais composée de cette famille d’algorithmes, et nous avons implémenté un setter pour remplacer cette propriété par n’importe quelle implémentation de l’interface `Deplacement`. Nous pouvons maintenant nous passer de la sous‑classe `Oiseau`, et notre instance d’`Animal` peut changer de stratégie de déplacement pendant l’exécution du programme. Pour ajouter une nouvelle façon de se déplacer, il suffit de créer une nouvelle classe implémentant notre interface `Deplacement`.

Cependant, depuis Java 8, il est possible d’implémenter ce pattern de façon plus fonctionnelle en utilisant les *Functional Interfaces*, nous délestant ainsi de la nécessité de créer une classe et ses implémentations pour définir nos stratégies.

```java
@FunctionalInterface
interface Deplacement {
    void avancer();
}

class Animal {

    private String name;
    public Animal(String name){
        this.name = name;
    }

    public void avancer(Deplacement deplacement){
        deplacement.avancer();
    }
}

class Main {
    public static void main(){
        Animal oiseau = new Animal("Oiseau");
        oiseau.avancer(() -> System.out.println("Moi je vole..."));
        //Output: "Moi je vole..."
        oiseau.avancer(() -> System.out.println("Moi je marche..."));
        //Output: "Moi je marche..."
    }
}
```

Ici, on définit une *Functional Interface* représentant une fonction sans paramètre et sans valeur de retour. Cette fonction est passée en paramètre de la méthode `avancer()` de la classe `Animal` pour être appelée à l’intérieur de celle‑ci. La *Functional Interface* nous permet ainsi de définir le comportement de la fonction `avancer()` à la volée lors de son appel, grâce à une expression lambda. Cette approche avec les lambdas s’avère particulièrement utile pour des comportements ponctuels ou des stratégies peu complexes. Cependant, si les stratégies se complexifient, il est préférable de revenir à l’approche avec des classes concrètes, offrant une meilleure maintenabilité et évitant la répétition de code. L’avantage principal de cette implémentation du pattern réside dans la possibilité de définir la logique au plus près de son utilisation.

Si l’on reprend l’exemple donné dans mon précédent article sur le proxy pattern : [Le Proxy Pattern](https://anisikram.fr/le-proxy-pattern/), vous remarquerez que nous utilisions déjà le Strategy pattern. En effet, l’interface `HeavyDataFetcher` représente une famille de stratégies à implémenter (par `HeavyDataSqlFetcher`, par exemple), sauf qu’ici, la classe cliente n’est pas `Animal`, mais bien la classe `Application` et sa méthode `main()`.

---

Pour conclure, le Strategy pattern offre une solution souple pour gérer les variations de comportement en favorisant la composition sur l’héritage. Il permet de modifier les comportements dynamiquement, tout en respectant le principe *Ouvert/Fermé* des règles **SOLID**, ce qui améliore la maintenabilité du code. Avec l’arrivée des *functional interfaces* en Java 8, l’implémentation de ce pattern devient encore plus simple grâce aux expressions lambda, bien qu’il faille veiller à éviter la duplication de code. En résumé, le Strategy pattern est une approche efficace pour concevoir des objets capables d’adopter plusieurs comportements de manière flexible et évolutive.
