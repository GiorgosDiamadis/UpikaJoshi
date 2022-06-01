# Node.Js script for package update
(node version v16.15.0)

Given a list of Github repositories and the package you want to update,
this scripts checks if the specified version is greater than or equal to the version on each repository.

For example given this data:

| Repo                    | Repository |
|:------------------------|:----------:|
| dyte-js-sample-app      |   https://github.com/dyte-in/javascript-sample-app    |
| dyte-sample-app-backend |    https://github.com/dyte-in/backend-sample-app    |
| dyte-react-sample-app          |   https://github.com/dyte-in/react-sample-app/    |

and the command:  node .\commands.js -update -i input.csv web-vitals@3.9.0 it gives the following result

| Repo                          |                   Repository                     | version | version_satisfied |                      update_pr                      |
|:------------------------------|:------------------------------------------------:|:-------:|:-----------------:|:---------------------------------------------------:|
| dyte-js-sample-app            | https://github.com/dyte-in/javascript-sample-app |   N/A   |      false        |                                                     |
| dyte-sample-app-backend       |  https://github.com/dyte-in/backend-sample-app   |   N/A   |       false       |                                                     |
| dyte-react-sample-app         |   https://github.com/dyte-in/react-sample-app/   |  1.0.1  |       false       | https://github.com/dyte-in/react-sample-app/pull/30 |

Specify the option -update if you want to create a pull request.
The csv file is given after the parameter -i and must be in the same directory.
