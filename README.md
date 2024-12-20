# FOAM3

Build fully featured high performance apps in less time using FOAM.

  * Application Speed
  * Application Size
  * Developer Efficiency

"Fast apps Fast"

FOAM3 is the active version of FOAM.

The FOAM1 [website](https://foam-framework.github.io/foam/) still contains many useful demos and videos (but some links may be broken).

Ask questions and get help on the [FOAM Discussion Group](https://groups.google.com/g/foam-framework-discuss).

<!--
[![Build Status](https://travis-ci.org/foam-framework/foam3.svg?branch=master)](https://travis-ci.org/foam-framework/foam3) -->

## Feature Oriented Active Modeller

FOAM is a modeling tool and class based object system.  To use FOAM,
you create a model of your class by describing the properties, methods,
event topics, listeners, and dependencies of your class.  FOAM takes
this model and generates a usable JavaScript class along with several
companion features such as database support and network marshaling.

While FOAM is written in JavaScript, it can be used to generate code
for any language or platform, including Android Java and iOS Swift.

# Development
## Installing Dependencies

FOAM has no runtime dependencies, but uses a number of third party tools for
unit tests, code coverage, and linting.  You can install all required
tools by doing the following.

* Install nodejs.

* Run `npm install` in the root of the FOAM repository, where
  package.json is found.

## Building Java

**NOTE: default configuration is setup for Java 21** 

If using a version less than 21, change the `java: 21` property in the root pom.js.

If deploying with **-u** or remotely, update the garbage collection configuration in `tools/deploy/etc/shrc.local`. 

### Build and run Java webserver

`./build.sh [options]`

* visit: http://localhost:8080/src/foam/nanos/controller/index.html

#### common options:

* **-h** - help - show all options
* **-c** - clean
* **-d** - debug mode allowing connection by a remote debugger
* **-j** - delete runtime journals
* **-Jpom1,pom2,...,pomN** - where pomN,... are found relative to the deployment folder. 
* **-u** - build and deploy from a single Java jar file. Intented for remote server installs.

#### If building with option **-u**, then 

* visit: https://localhost:8443

**NOTE: this deployment uses a self-sign certificate which your browser will warn you about**

<!--
## Running Application Controller

The FOAM Application Controller allows you to access components of your foam
app by using the browser & displaying it as a GUI.
To access, run the following in the parent directory of foam3:
-->

## Remote deployment

To build and deploy to a remote linux instance

1. build: `./build.sh -uck[Jpom...]`
1. deploy: `foam3/tools/bin/install.sh hostname`
1. visit: https://hostname:8443

## Style Guide

All code should follow the [style guide.](doc/guides/StyleGuide.md)

## Testing
To run all Java tests from the command-line, run:
`./build.sh -ct`

To run individual tests from the command-line, run:
`./build.sh -cTtestName1,testName2,...testNameN`

<!--
* _npm test_ runs standard unit tests.

* _npm run testDebug_ runs the unit tests with a debugger.

* _npm run coverage_ runs code coverage and creates an html report in /coverage.

For in-browser testing, run your favorite web server at the root of the FOAM
repository. In a browser, navigate to
[http://localhost:8080/test/browser/SpecRunner.html](http://localhost:8000/test/browser/SpecRunner.html)
to run the unit tests.
-->
# Documentation

## Videos
- [Short Intro](https://www.youtube.com/watch?v=S4LbUv5FsGQ)
- [Medium Intro](https://www.youtube.com/watch?v=n699DWb2TUs)
- [Long Intro](https://www.youtube.com/watch?v=PsFLlgrzn2E)
- [Reactive Programming in FOAM](https://www.youtube.com/watch?v=-fbq-_H6Lf4)
- [UNIX and Google](https://www.youtube.com/watch?v=3Ea3pkTCYx4)
- [Olympic Medals Demo](https://www.youtube.com/watch?v=y9i4oW9dHHw)
- [Turtle Graphics](https://www.youtube.com/watch?v=4wO_RrftJTE)

## Guides
- [Contexts](doc/guides/Context.md)
- [DAOs](doc/guides/Dao.md)
- [DAO Examples](doc/guides/DaoExamples.md)
- [Easy DAO](doc/guides/EasyDao.md)
- [Enums](doc/guides/Enum.md)
- [Project Object Models (POMs)](doc/guides/POM.md)
- [Porting](doc/guides/Porting.md)
- [Services](doc/guides/Services.md)

## Cheatsheets
- [Short Form](https://docs.google.com/document/d/1IUH4jveNk5eidFiXr-m76mYOAdPMA5TngF-wgN4zFvM/edit?usp=sharing)
- [Long Form](https://docs.google.com/document/d/1XnxtQ_B6D1SWo2FSh8UkWq1euElBLONBVBCo6cPueL4/edit?usp=sharing)

## Tutorials
<!--
- [TODO](http://foam-framework.github.io/foam/tutorial/todo/0-intro/) (needs to be ported to FOAM3, needs fixes, even for FOAM1) -->
- [PhoneCat](https://github.com/kgrgreer/foam3/blob/development/tutorial/phonecat/0-intro.md)

## Demos
- [FOAM1 Demo Catalog](http://foam-framework.github.io/foam/foam/demos/DemoCat.html)

## Live Demos
Launch FOAM 
- [FOAM By Example](http://localhost:8080/foam3/src/foam/demos/examples/index.html)
- [Seven GUIs](http://localhost:8080/foam3/src/foam/demos/sevenguis/index.html)
- [Other Demos](http://localhost:8080/foam3/src/foam/demos/index.html)

## NANOS
To run NANOS, the FOAM Java Application Server, run:
`./build.sh -Jdemo`
then connect to http://localhost:8080

## Example FOAM Projects
- An [Example FOAM Project](https://github.com/adamvy/example-foam-project) which shows how to consume/use FOAM from an external repository.
- [Another example FOAM Project](https://github.com/jlhughes/Journal) building on the above with more models and example data. 

## Design Patterns
The following course is not directly about FOAM, but covers material essential for fully understanding FOAM's design:

[Introduction to Design Patterns](https://docs.google.com/presentation/d/1kcohKD0WJHJWoJshOUpVdk-Pa3oeJMt9DTl63gWt-bo/edit)

Videos: [Part 1](https://www.youtube.com/watch?v=uslGu0kezeg), [Part2](https://www.youtube.com/watch?v=jzWjp_B7wE4), [Part 3](https://www.youtube.com/watch?v=yIfPa7yzYpQ)
