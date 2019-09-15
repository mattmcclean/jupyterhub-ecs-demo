# dummy for testing. Don't use this in production!
c.JupyterHub.authenticator_class = 'dummyauthenticator.DummyAuthenticator'

# launch with custom ECS Spawner
c.JupyterHub.spawner_class = 'ecsspawner.EcsSpawner'

c.JupyterHub.hub_ip = '0.0.0.0'

#  set the level of DEBUG
c.JupyterHub.log_level = 'DEBUG'

# set the timeout to start a new notebook
c.EcsSpawner.start_timeout = 1200
c.EcsSpawner.http_timeout = 1200

# set the URL to JupyterLab
c.EcsSpawner.default_url = '/lab'