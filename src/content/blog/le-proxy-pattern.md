---
title: Le Pattern Proxy
date: 2025-10-01
description: Présentation & implémentation du patron de conception Proxy en Java
author: Anis Ikram
image: /proxy.png
---

Dans cet article, je vais tâcher d’expliquer en quoi consiste le patron de conception appelé **design pattern proxy**.  
Un proxy, comme on le nomme communément entre développeurs, est un patron de conception qui entre dans la catégorie des **design patterns structurels**.  
Cette catégorie englobe les patterns qui utilisent des interfaces, l’héritage et le polymorphisme afin de définir des ensembles plus larges.

---

Un proxy permet au client un accès distant à une ressource grâce à une interface commune.  
Il se substitue à cette ressource afin d’effectuer des actions avant ou après son accès.  
En effet, il permet de contrôler l’accès à un objet, de faire une instantiation différée (*lazy loading*), de logger des informations, de rafraîchir un cache, etc.

Dans la pratique, il est très utilisé dans de nombreux frameworks, et il arrive que l’on en manipule sans même s’en rendre compte.  
Prenons quelques exemples dans l’écosystème Java (c’est celui que je connais le mieux) :

- **Annotation `@Transactional`** : son utilisation sur une méthode déclenche la création d’un proxy sur la classe porteuse de cette annotation afin de créer, si nécessaire, une transaction au début de vos méthodes, et de la committer à la fin de celles‑ci.
- **Associations `FetchType.LAZY` avec Hibernate** : lorsque l’on manipule des entités dont les associations sont définies à **LAZY**, Hibernate utilise un proxy à la place de l’association afin de provoquer son chargement depuis la base de données lorsque la méthode est appelée sur cette dernière.

## Exemple d’implémentation

Maintenant que nous avons vu en quoi consiste le pattern proxy, voici un exemple d’implémentation.  
Nous avons ici une classe qui effectue une tâche coûteuse afin de récupérer des données qui demeurent identiques sur une même journée.  
Nous aimerions ajouter quelques fonctionnalités afin de logger la date à laquelle on la récupère à chaque fois et de mettre les données en cache afin d’optimiser les performances :

```java
public interface HeavyDataFetcher {
    HeavyData fetchData();
}

public class HeavySqlDataFetcher implements HeavyDataFetcher {

    @Override
    public HeavyData fetchData() {
        // Du code pour récupérer les données en base
    }
}

public class Application {
    public static void main(String[] args) {
        HeavyDataFetcher dataFetcher = new HeavySqlDataFetcher();
        HeavyData data = dataFetcher.fetchData();
        System.out.println(data);
    }
}
```

Cette classe `HeavySqlDataFetcher` implémente une interface `HeavyDataFetcher`, ce qui est une bonne pratique car cela laisse la possibilité de définir une autre classe pour récupérer les données d’une manière différente (par exemple à partir d’une autre source que la base de données SQL).  
Afin de créer notre proxy, nous allons implémenter cette interface pour bénéficier du polymorphisme, et pouvoir ainsi substituer la classe `HeavySqlDataFetcher` par notre proxy.  
Un proxy doit avoir, comme propriété, l’objet qu’il substitue afin de pouvoir y accéder.

```java
public class HeavySqlDataFetcherProxy implements HeavyDataFetcher {

    private HeavySqlDataFetcher sqlDataFetcher;

    public HeavySqlDataFetcherProxy(HeavySqlDataFetcher sqlDataFetcher) {
        this.sqlDataFetcher = sqlDataFetcher;
    }

    @Override
    public HeavyData fetchData() {
        return this.sqlDataFetcher.fetchData();
    }
}
```

Actuellement, notre classe proxy ne fait que passer la requête sans induire de changement dans le comportement de l’objet substitué.  
Nous pouvons maintenant mettre en place un cache pour stocker les données récupérées dans une variable d’instance, ainsi que logger chaque mise à jour du cache.

```java
public class HeavySqlDataFetcherProxy implements HeavyDataFetcher {

    private final HeavySqlDataFetcher sqlDataFetcher;
    private final Logger logger;
    private HeavyData cachedData;
    private Instant cacheDate;

    public HeavySqlDataFetcherProxy(HeavySqlDataFetcher sqlDataFetcher) {
        this.sqlDataFetcher = sqlDataFetcher;
        this.logger = Logger.getLogger(HeavySqlDataFetcherProxy.class.getName());
    }

    @Override
    public HeavyData fetchData() {
        if (cachedData == null || Instant.now().minus(1, ChronoUnit.DAYS).isAfter(cacheDate)) {
            this.cacheDate = Instant.now();
            logger.info("Data accessed at: " + this.cacheDate);
            this.cachedData = this.sqlDataFetcher.fetchData();
        }
        return cachedData;
    }
}
```

Comme on peut le voir, la méthode `fetchData()` a été enrichie.  
Si le cache est nul ou que sa date de mise à jour dépasse un jour, les données sont rechargées depuis la base pour mettre à jour le cache et la date de mise à jour.  
Les nouvelles données sont ensuite retournées. Si les données sont toujours valides, elles sont simplement retournées à partir du cache sans être rechargées.  
Nous loggons également la date de mise à jour à chaque fois que les données sont actualisées.

## Utilisation du proxy

Maintenant que notre proxy est implémenté, il peut être utilisé en remplacement de l’objet substitué en modifiant très légèrement le code client :

```java
public class Application {
    public static void main(String[] args) {
        HeavyDataFetcher dataFetcher = new HeavySqlDataFetcherProxy(new HeavySqlDataFetcher());
        HeavyData data = dataFetcher.fetchData();
        System.out.println(data);
    }
}
```

En effet, il suffit de modifier l’instantiation d’un objet de type `HeavyDataFetcher` pour utiliser notre proxy, et le tour est joué.  
Nous avons modifié le comportement pour accéder à nos données de manière (presque) transparente pour le client !  
Il est ici encore possible d’améliorer notre proxy en changeant le type de la propriété `sqlDataFetcher` par l’interface `HeavyDataFetcher` ; ainsi notre proxy pourrait se substituer à n’importe quelle implémentation.

### Version finale de la classe proxy

Voici la version finale de la classe proxy :

```java
public class HeavyDataFetcherProxy implements HeavyDataFetcher {

    private final HeavyDataFetcher dataFetcher;
    private final Logger logger;
    private HeavyData cachedData;
    private Instant cacheDate;

    public HeavyDataFetcherProxy(HeavyDataFetcher dataFetcher) {
        this.dataFetcher = dataFetcher;
        this.logger = Logger.getLogger(HeavySqlDataFetcherProxy.class.getName());
    }

    @Override
    public HeavyData fetchData() {
        if (cachedData == null || Instant.now().minus(1, ChronoUnit.DAYS).isAfter(cacheDate)) {
            this.cacheDate = Instant.now();
            logger.info("Data accessed at: " + this.cacheDate);
            this.cachedData = this.dataFetcher.fetchData();
        }
        return cachedData;
    }
}
```

### Conclusion

Le design pattern proxy permet de **contrôler l’accès** à un objet et d’ajouter des fonctionnalités annexes sans changer le code de la classe d’origine.  
Grâce à l’utilisation d’une interface commune, il offre une grande flexibilité, permettant d’optimiser les performances (par exemple avec le cache), de journaliser les accès ou de gérer des transactions.  
Comme montré dans cet exemple, l’utilisation du proxy se fait de manière transparente pour le code client, ce qui facilite son intégration dans des applications existantes.

Dans l’écosystème Java, le proxy est omniprésent et utilisé implicitement dans des frameworks comme Spring ou Hibernate, offrant ainsi des fonctionnalités avancées sans intervention explicite du développeur.  
Sa capacité à séparer les préoccupations techniques (gestion de transactions, journalisation, cache) des préoccupations métiers en fait un outil puissant pour structurer et optimiser des applications complexes.
