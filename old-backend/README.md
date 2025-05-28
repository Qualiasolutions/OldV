# Vuet Developer Information
This repo contains the code associated to the Vuet backend. This includes definitions of all classes - Tasks, Categories, etc - as well as the required logic to interact with the database.

## Table of Contents
1. [Local setup](#local-setup)
2. [GitFlow](#git-flow)
3. [Deployment](#deployment)
4. [Migrations](#migrations)
5. [Media Storage](#media-storage)
6. [Localstack](#localstack)
7. [Resetting Migrations](#resetting-migrations)
8. [Swagger Documentation](#swagger-documentation)
9. [Entities](#entities)
10. [Tasks](#tasks)

## Local setup
First get the code. You must be given access to the GitHub repo and then set up an SSH key as described [here](https://www.inmotionhosting.com/support/server/ssh/how-to-add-ssh-keys-to-your-github-account/). Then simply run `git clone git@github.com:Vuet-app/VuetApi.git` in a terminal to pull the code onto your machine. If you don't have Git installed then you will have to install it, simply google how to do this if necessary.

We use Docker to reliably launch the same containerised code in any environment. A first step to running the backend locally is to install Docker for the relevant operating system - downloads can be found [here](https://www.docker.com/products/docker-desktop/).

After downloading Docker, we must set up the database and a superuser. To do this:
- Start the Django server - open a terminal and run it in Docker via `docker-compose up vuetapi`. This terminal will keep showing the logs from the backend and should be left as is.
- Set up the database
    - Open a new terminal
    - Run `docker ps` to see the list of running docker containers
    - Find the ID of the `vuetapi` container and run `docker exec -it <ID> sh`
    - Once in the container, run `python manage.py migrate` - this runs all of the migrations to bring the database up to the current state
- Set up a superuser
    - While still in the Docker containter run `python manage.py createsuperuser` and follow the onscreen instructions.
    - You should now be able to go to `localhost:8000/admin` and log in with your superuser details.
    - You can now close this terminal

## Git Flow
We don't have too much process around branch naming convention etc. The only rule (which is enforced by GitHub permissions) is to not work directly on the master branch. So the process for making a new feature would typically be something like:
- checkout the master branch (`git checkout master`)
- pull the latest changes (`git pull`)
- check out a new feature branch (`git checkout -b MY_BRANCH_NAME`) where `MY_BRANCH_NAME` is replaced with a descriptive name of the branch.
- do any work
- git add the work that you want to commit (`git add .` adds all changed files. If you don't want to add all changed files then you can add individual files instead. See [here](https://www.earthdatascience.org/workshops/intro-version-control-git/basic-git-commands/#:~:text=git%20add%20%3A%20takes%20a%20modified,associated%20with%20a%20unique%20identifier.))
- commit the work `git commit -m "MY_COMMIT_MESSAGE"`, replacing `MY_COMMIT_MESSAGE` with a descriptive message describing the work that has been done.
- push the feature branch to github (`git push origin HEAD`)

## Deployment
Deployment is managed by CircleCI (see `.circleci/config.yml`). All deployment is automatic and it consists of the following steps:

- Build and push the latest image to ECR
- Force a redeployment of the ECS service using the latest image

## Migrations
Migrations should be created execing into the API docker conatiner (as in [Local setup](#local-setup)) and running:
- `python manage.py makemigrations` to create the migration files
- `python manage.py migrate` to run the migrations

`python manage.py migrate` is automatically run in prod when the service starts.

## Media Storage
User-uploaded media is stored in S3 using the `django-storages` [package](https://django-storages.readthedocs.io/en/latest/).

## Localstack
S3 services are spun up locally using localstack. localstack may need to be added to your hosts file in order for images loaded from localstack S3 to render properly - see https://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/


## Resetting Migrations
Occasionally (during development at least) we may want to reset the migration files to tidy up or deal with dependency issues. After migrations have been reset the following steps should be followed:

- exec into postgres container (as in [Local setup](#local-setup) but with the ID of the postgres container rather than the vuetapi container)
- `psql postgres --user=dev`
- `DROP DATABASE vuet;`
- `CREATE DATABASE vuet;`
- exec into vuetapi container
- `python manage.py migrate` to rerun the new migration files from scratch


## Swagger documentation
We use a package called [drf-yasg](https://drf-yasg.readthedocs.io/en/stable/) to automatically generate Swagger API documentation. This can be seen at `http://localhost:8000/docs/swagger/` when the app is running locally. This documentation describes all of the endpoints and their basic functionality.

# How Vuet Works
There are two main concepts in the Vuet world - Tasks and Entities. These models form the basis for almost all of the app functionality.
## Entities
An entity is a "thing" that a user has saved to which tasks can be assigned. Examples might include cars, holidays, pets, hobbies etc.

Entities can also have subentities. A subentity is created by creating a normal `Entity` but with a `parent` field pointing to another entity. Examples of subentities include things such as reading lists (whose parent might be a reading hobby) and gifts (whose parent might be a birthday party).

## Tasks
Tasks are jobs that need doing which are assigned to entities. There are various types of task:
- `FixedTask` - these are tasks with fixed start and end times. They always show up in the calendar at the specified time. E.g. go to an appointment at the hospital.
- `FlexibleTask` - these are tasks which do not have to be done at a specific time. Instead of a fixed start and end time they have a `due_date` field, a `earliest_action_date` field and a `duration` field,
    - `due_date` - this is the date by which a task must be done
    - `earliest_action_date` - this is the earliest date on which the task can be scheduled
    - `duration` - this is the length of the task that needs doing, in minutes

### Recurrence
As well as having these various task types, we have a concept of recurrence.

A recurring task is one that occurs every day, week, month, year, or on some custom schedule. They may be fixed, flexible, or managed. Specific instances of a recurring task can be updated using a `RecurrentTaskOverwrite` object. 
