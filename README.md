# Covid Dashboard - Visualization Project

Find the deployed version [here](https://wwwlab.cs.univie.ac.at/~simone99/VIS21W/A5/).

## Purpose
The aim of this project is to apply data visualization heuristics and best practises in a project with current relevancy. <br>
Different visualization techniques are used to display certain entities of an huge dataset in a easily-digestable way. 

## Visualizations
### Scatterplot
A Scatterplot showing the relation between new COVID infections and deaths per 1 million people is shown. It gives a quick overview of all countries in Europe, while having the ability of getting details on demand by hovering or clicking on a country.
![image](https://user-images.githubusercontent.com/75510543/202667782-e02a29fb-cd68-4734-a086-1c40519c3bde.png)


### Bivariate Choropleth Map
A map of Europe shows the relation between ICU patients and new infections. As with the first graph, details on demand are available.
![image](https://user-images.githubusercontent.com/75510543/202667434-eb934c8b-c841-4d8b-a8dc-f362b110d054.png)


### Stacked Bar Chart
When a country is selected anywhere, that countries vaccination rate can be compared to the European average or any other European country. The proportion of different doses can also be compared and exact values read with given tooltips.
![image](https://user-images.githubusercontent.com/75510543/202667368-279410ed-447d-498a-b0e3-f8ed7c49c146.png)


### Bar Chart
Five different probable risk factors for COVID injections are shown for a selected country. This way, users can inspect certain statistical properties of a selected country in detail and search for correlations.
![image](https://user-images.githubusercontent.com/75510543/202667500-4c158593-93d1-4735-985d-687cd06c4318.png)

## What I´ve learned
- Working with huge datasets
- How to design visualizations in a scientifically-recommended way
- Applying design heuristics, like details-on-demand
- Avoiding pitfalls in visualization design
- Global state management with VueX
