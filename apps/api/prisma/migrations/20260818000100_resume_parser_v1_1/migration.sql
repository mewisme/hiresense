BEGIN;

UPDATE ai_pipeline_versions
SET is_active = false
WHERE pipeline_type = 'RESUME_PARSER'
  AND is_active = true;

INSERT INTO ai_pipeline_versions (
  code,
  pipeline_type,
  semantic_version,
  config,
  is_active
)
VALUES (
  'resume-parser-v1.1',
  'RESUME_PARSER',
  '1.1.0',
  $json$
  {
    "phase": "internship",
    "description": "Expanded deterministic CV parser skill alias dictionary",
    "skillAliases": {
      "js": "javascript",
      "java script": "javascript",
      "ecmascript": "javascript",
      "ecma script": "javascript",
      "es6": "javascript",
      "es2015": "javascript",
      "es2016": "javascript",
      "es2017": "javascript",
      "es2018": "javascript",
      "es2019": "javascript",
      "es2020": "javascript",
      "es2021": "javascript",
      "es2022": "javascript",
      "es2023": "javascript",

      "ts": "typescript",
      "type script": "typescript",

      "py": "python",
      "python3": "python",
      "python 3": "python",

      "java8": "java",
      "java 8": "java",
      "java11": "java",
      "java 11": "java",
      "java17": "java",
      "java 17": "java",
      "java21": "java",
      "java 21": "java",

      "c sharp": "c#",
      "c-sharp": "c#",
      "csharp": "c#",
      "c #": "c#",

      "cpp": "c++",
      "cplusplus": "c++",
      "c plus plus": "c++",
      "c ++": "c++",

      "ansi c": "c",
      "c language": "c",

      "golang": "go",
      "go lang": "go",

      "rustlang": "rust",
      "rust lang": "rust",

      "php7": "php",
      "php 7": "php",
      "php8": "php",
      "php 8": "php",

      "ruby lang": "ruby",
      "kotlin lang": "kotlin",
      "swift language": "swift",
      "scala lang": "scala",
      "dart lang": "dart",
      "r language": "r",
      "r programming": "r",

      "objective c": "objective-c",
      "objectivec": "objective-c",
      "objc": "objective-c",

      "vb": "visual basic",
      "vb.net": "visual basic",
      "vb net": "visual basic",
      "visual basic .net": "visual basic",

      "pwsh": "powershell",
      "power shell": "powershell",
      "powershell script": "powershell",
      "powershell scripting": "powershell",

      "bash shell": "bash",
      "bash script": "bash",
      "bash scripting": "bash",
      "bourne again shell": "bash",

      "react js": "react",
      "reactjs": "react",
      "react.js": "react",

      "next js": "next.js",
      "nextjs": "next.js",
      "next js framework": "next.js",

      "vue": "vue.js",
      "vue js": "vue.js",
      "vuejs": "vue.js",
      "vue 2": "vue.js",
      "vue2": "vue.js",
      "vue 3": "vue.js",
      "vue3": "vue.js",

      "nuxt": "nuxt.js",
      "nuxt js": "nuxt.js",
      "nuxtjs": "nuxt.js",

      "angular 2": "angular",
      "angular2": "angular",
      "angular 2+": "angular",
      "angular 4": "angular",
      "angular4": "angular",
      "angular 5": "angular",
      "angular5": "angular",
      "angular 6": "angular",
      "angular6": "angular",
      "angular 7": "angular",
      "angular7": "angular",
      "angular 8": "angular",
      "angular8": "angular",
      "angular 9": "angular",
      "angular9": "angular",
      "angular 10": "angular",
      "angular10": "angular",
      "angular 11": "angular",
      "angular11": "angular",
      "angular 12": "angular",
      "angular12": "angular",
      "angular 13": "angular",
      "angular13": "angular",
      "angular 14": "angular",
      "angular14": "angular",
      "angular 15": "angular",
      "angular15": "angular",
      "angular 16": "angular",
      "angular16": "angular",
      "angular 17": "angular",
      "angular17": "angular",
      "angular 18": "angular",
      "angular18": "angular",

      "angular js": "angularjs",
      "angular.js": "angularjs",
      "angular 1": "angularjs",
      "angular 1.x": "angularjs",

      "svelte js": "svelte",
      "sveltejs": "svelte",
      "svelte kit": "sveltekit",
      "svelte-kit": "sveltekit",

      "j query": "jquery",
      "jquery js": "jquery",

      "html5": "html",
      "html 5": "html",
      "css3": "css",
      "css 3": "css",

      "scss": "sass",

      "tailwind": "tailwind css",
      "tailwindcss": "tailwind css",
      "tailwind-css": "tailwind css",

      "bootstrap4": "bootstrap",
      "bootstrap 4": "bootstrap",
      "bootstrap5": "bootstrap",
      "bootstrap 5": "bootstrap",
      "bootstrap css": "bootstrap",

      "mui": "material ui",
      "material-ui": "material ui",
      "materialui": "material ui",

      "chakra-ui": "chakra ui",
      "chakraui": "chakra ui",

      "antd": "ant design",
      "ant-design": "ant design",

      "reduxjs": "redux",
      "redux js": "redux",
      "redux toolkit": "redux",
      "rtk": "redux",

      "zustand js": "zustand",

      "vitejs": "vite",
      "vite js": "vite",

      "webpack js": "webpack",

      "babeljs": "babel",
      "babel js": "babel",

      "three js": "three.js",
      "threejs": "three.js",

      "d3": "d3.js",
      "d3 js": "d3.js",
      "d3js": "d3.js",

      "node js": "node.js",
      "nodejs": "node.js",
      "node": "node.js",

      "express": "express.js",
      "express js": "express.js",
      "expressjs": "express.js",

      "nest js": "nestjs",
      "nest.js": "nestjs",
      "nest js framework": "nestjs",

      "fastify js": "fastify",
      "fastifyjs": "fastify",

      "django framework": "django",
      "flask python": "flask",

      "fast api": "fastapi",
      "fast-api": "fastapi",

      "springboot": "spring boot",
      "spring-boot": "spring boot",

      "spring core": "spring framework",

      "spring-mvc": "spring mvc",

      "laravel php": "laravel",
      "symfony php": "symfony",

      "rails": "ruby on rails",
      "ruby rails": "ruby on rails",
      "ror": "ruby on rails",

      "aspnet core": "asp.net core",
      "asp net core": "asp.net core",
      "aspnetcore": "asp.net core",

      "aspnet": "asp.net",
      "asp net": "asp.net",

      "dotnet": ".net",
      "dot net": ".net",
      ".net framework": ".net",
      "dot net framework": ".net",

      "grpc api": "grpc",
      "g rpc": "grpc",

      "graph ql": "graphql",
      "graphql api": "graphql",

      "rest": "rest api",
      "restful": "rest api",
      "restful api": "rest api",
      "restful web services": "rest api",
      "rest web services": "rest api",

      "soap api": "soap",
      "soap web services": "soap",

      "web socket": "websocket",
      "web sockets": "websocket",
      "websockets": "websocket",

      "socket io": "socket.io",
      "socketio": "socket.io",

      "reactnative": "react native",
      "react-native": "react native",

      "flutter sdk": "flutter",

      "android sdk": "android",
      "android development": "android",
      "native android": "android",

      "ios sdk": "ios",
      "ios development": "ios",
      "native ios": "ios",

      "swift ui": "swiftui",

      "android compose": "jetpack compose",
      "compose for android": "jetpack compose",
      "jetpack-compose": "jetpack compose",

      "ionic framework": "ionic",

      "xamarin forms": "xamarin",
      "xamarin.forms": "xamarin",

      "maui": ".net maui",
      "dotnet maui": ".net maui",
      ".net multi-platform app ui": ".net maui",

      "postgres": "postgresql",
      "postgres sql": "postgresql",
      "pgsql": "postgresql",
      "postgre": "postgresql",
      "postgre sql": "postgresql",
      "postgres db": "postgresql",
      "postgresql db": "postgresql",

      "my sql": "mysql",
      "mysql db": "mysql",

      "maria db": "mariadb",

      "sqlite3": "sqlite",
      "sqlite 3": "sqlite",

      "sql server": "microsoft sql server",
      "mssql": "microsoft sql server",
      "ms sql": "microsoft sql server",
      "ms sql server": "microsoft sql server",

      "oracle db": "oracle database",

      "mongo": "mongodb",
      "mongo db": "mongodb",
      "mongodb atlas": "mongodb",

      "redis db": "redis",
      "redis cache": "redis",

      "elastic search": "elasticsearch",
      "elastic-search": "elasticsearch",

      "open search": "opensearch",
      "open-search": "opensearch",

      "cassandra": "apache cassandra",

      "dynamo db": "dynamodb",
      "amazon dynamodb": "dynamodb",
      "aws dynamodb": "dynamodb",

      "firebase firestore": "firestore",
      "cloud firestore": "firestore",
      "google firestore": "firestore",

      "neo 4j": "neo4j",
      "cockroach db": "cockroachdb",
      "snowflake db": "snowflake",

      "bigquery": "google bigquery",
      "big query": "google bigquery",
      "gcp bigquery": "google bigquery",
      "google big query": "google bigquery",

      "redshift": "amazon redshift",
      "aws redshift": "amazon redshift",

      "click house": "clickhouse",
      "supa base": "supabase",

      "prisma orm": "prisma",
      "prisma.js": "prisma",

      "type orm": "typeorm",

      "sequelize js": "sequelize",
      "sequelizejs": "sequelize",
      "sequelize.js": "sequelize",

      "hibernate orm": "hibernate",

      "ef core": "entity framework core",
      "efcore": "entity framework core",

      "ef": "entity framework",

      "sql alchemy": "sqlalchemy",
      "sqlalchemy orm": "sqlalchemy",

      "mongoose js": "mongoose",
      "mongoosejs": "mongoose",

      "drizzle": "drizzle orm",
      "drizzle-orm": "drizzle orm",

      "java persistence api": "jpa",
      "jakarta persistence": "jpa",

      "my batis": "mybatis",

      "dapper orm": "dapper",

      "amazon web services": "aws",
      "amazon aws": "aws",

      "azure": "microsoft azure",
      "ms azure": "microsoft azure",

      "gcp": "google cloud platform",
      "google cloud": "google cloud platform",

      "docker engine": "docker",
      "docker container": "docker",
      "docker containers": "docker",

      "docker-compose": "docker compose",

      "k8s": "kubernetes",
      "k8": "kubernetes",
      "kube": "kubernetes",
      "kubernetes cluster": "kubernetes",

      "helm chart": "helm",
      "helm charts": "helm",

      "hashicorp terraform": "terraform",
      "terraform iac": "terraform",

      "ansible automation": "ansible",

      "jenkins ci": "jenkins",
      "jenkins pipeline": "jenkins",

      "github action": "github actions",
      "gh actions": "github actions",
      "github actions ci": "github actions",
      "github ci": "github actions",

      "gitlab ci": "gitlab ci/cd",
      "gitlab cicd": "gitlab ci/cd",
      "gitlab ci cd": "gitlab ci/cd",
      "gitlab pipeline": "gitlab ci/cd",

      "circle ci": "circleci",

      "travisci": "travis ci",
      "travis": "travis ci",

      "argocd": "argo cd",
      "argo-cd": "argo cd",

      "flux cd": "fluxcd",

      "prometheus monitoring": "prometheus",
      "grafana dashboard": "grafana",

      "data dog": "datadog",
      "newrelic": "new relic",

      "elk": "elastic stack",
      "elk stack": "elastic stack",

      "nginx web server": "nginx",
      "nginx reverse proxy": "nginx",

      "apache2": "apache http server",
      "apache 2": "apache http server",
      "httpd": "apache http server",
      "apache web server": "apache http server",

      "gnu/linux": "linux",
      "linux os": "linux",
      "ubuntu linux": "ubuntu",
      "cent os": "centos",
      "debian linux": "debian",
      "unix os": "unix",

      "git scm": "git",
      "git version control": "git",

      "git hub": "github",
      "git lab": "gitlab",
      "bit bucket": "bitbucket",

      "sonar cube": "sonarqube",
      "sonar-qube": "sonarqube",

      "vault": "hashicorp vault",
      "consul": "hashicorp consul",

      "istio service mesh": "istio",
      "linkerd service mesh": "linkerd",

      "cloud flare": "cloudflare",

      "lambda aws": "aws lambda",
      "amazon lambda": "aws lambda",

      "ec2": "amazon ec2",
      "aws ec2": "amazon ec2",

      "ecs": "amazon ecs",
      "aws ecs": "amazon ecs",

      "eks": "amazon eks",
      "aws eks": "amazon eks",

      "s3": "amazon s3",
      "aws s3": "amazon s3",

      "rds": "amazon rds",
      "aws rds": "amazon rds",

      "cloudfront": "amazon cloudfront",
      "aws cloudfront": "amazon cloudfront",

      "sqs": "amazon sqs",
      "aws sqs": "amazon sqs",

      "sns": "amazon sns",
      "aws sns": "amazon sns",

      "cognito": "amazon cognito",
      "aws cognito": "amazon cognito",

      "azure dev ops": "azure devops",

      "azure function": "azure functions",
      "microsoft azure functions": "azure functions",

      "azure web app": "azure app service",
      "app service azure": "azure app service",

      "aks": "azure kubernetes service",
      "azure aks": "azure kubernetes service",

      "gke": "google kubernetes engine",
      "google gke": "google kubernetes engine",

      "cloud run": "google cloud run",
      "gcp cloud run": "google cloud run",

      "cloud functions": "google cloud functions",
      "gcp cloud functions": "google cloud functions",

      "ai": "artificial intelligence",

      "ml": "machine learning",
      "machine-learning": "machine learning",

      "deep-learning": "deep learning",

      "nlp": "natural language processing",
      "natural-language processing": "natural language processing",

      "computer-vision": "computer vision",
      "image recognition": "computer vision",

      "llm": "large language models",
      "llms": "large language models",
      "large language model": "large language models",

      "genai": "generative ai",
      "gen ai": "generative ai",
      "generative artificial intelligence": "generative ai",

      "rag": "retrieval augmented generation",
      "retrieval-augmented generation": "retrieval augmented generation",

      "embedding": "embeddings",
      "vector embedding": "embeddings",
      "vector embeddings": "embeddings",
      "text embeddings": "embeddings",

      "vector db": "vector database",
      "vector store": "vector database",
      "vector storage": "vector database",

      "pg vector": "pgvector",
      "postgres vector": "pgvector",
      "postgresql vector": "pgvector",

      "lang chain": "langchain",
      "langchain js": "langchain",
      "langchain python": "langchain",

      "llama index": "llamaindex",
      "llama-index": "llamaindex",

      "open ai": "openai",
      "openai api": "openai",

      "huggingface": "hugging face",

      "tensor flow": "tensorflow",
      "tensorflow 2": "tensorflow",
      "tf2": "tensorflow",

      "torch": "pytorch",
      "py torch": "pytorch",

      "keras api": "keras",

      "sklearn": "scikit-learn",
      "scikit learn": "scikit-learn",

      "xg boost": "xgboost",
      "light gbm": "lightgbm",

      "pandas python": "pandas",
      "num py": "numpy",
      "sci py": "scipy",
      "mat plot lib": "matplotlib",

      "open cv": "opencv",
      "opencv-python": "opencv",

      "huggingface transformers": "transformers",
      "transformer library": "transformers",

      "spark": "apache spark",

      "py spark": "pyspark",

      "hadoop": "apache hadoop",

      "kafka": "apache kafka",

      "airflow": "apache airflow",

      "data build tool": "dbt",
      "dbt core": "dbt",

      "data bricks": "databricks",

      "jupyter notebook": "jupyter",
      "jupyter lab": "jupyter",
      "jupyterlab": "jupyter",

      "ml flow": "mlflow",
      "kube flow": "kubeflow",

      "pine cone": "pinecone",
      "weaviate db": "weaviate",
      "milvus db": "milvus",
      "qdrant db": "qdrant",

      "facebook ai similarity search": "faiss",

      "jest js": "jest",
      "jestjs": "jest",

      "vite test": "vitest",
      "vitest js": "vitest",

      "mocha js": "mocha",
      "mochajs": "mocha",

      "chai js": "chai",

      "cypress io": "cypress",
      "cypress.io": "cypress",

      "playwright test": "playwright",

      "selenium webdriver": "selenium",
      "selenium web driver": "selenium",

      "junit4": "junit",
      "junit 4": "junit",
      "junit5": "junit",
      "junit 5": "junit",

      "test ng": "testng",

      "py test": "pytest",

      "unittest": "python unittest",
      "python unit test": "python unittest",

      "r spec": "rspec",

      "php unit": "phpunit",

      "postman api": "postman",

      "hop scotch": "hoppscotch",

      "swagger ui": "swagger",
      "swagger api": "swagger",

      "open api": "openapi",
      "openapi spec": "openapi",
      "open api spec": "openapi",

      "jmeter": "apache jmeter",

      "grafana k6": "k6",

      "locust load testing": "locust",

      "rabbit mq": "rabbitmq",

      "nats.io": "nats",
      "nats io": "nats",

      "activemq": "apache activemq",
      "active mq": "apache activemq",

      "mqtt protocol": "mqtt",

      "web hook": "webhook",
      "webhooks": "webhook",

      "oauth2": "oauth 2.0",
      "oauth 2": "oauth 2.0",
      "oauth2.0": "oauth 2.0",

      "oidc": "openid connect",
      "open id connect": "openid connect",

      "json web token": "jwt",
      "json web tokens": "jwt",

      "key cloak": "keycloak",
      "auth zero": "auth0",

      "saml2": "saml",
      "saml 2.0": "saml",

      "lightweight directory access protocol": "ldap",

      "owasp top 10": "owasp",
      "owasp top ten": "owasp",

      "transport layer security": "tls",
      "secure sockets layer": "ssl",

      "b crypt": "bcrypt",
      "argon 2": "argon2",

      "micro services": "microservices",
      "micro-service architecture": "microservices",
      "microservice architecture": "microservices",
      "microservices architecture": "microservices",

      "monolith": "monolithic architecture",
      "monolithic": "monolithic architecture",

      "event driven architecture": "event-driven architecture",

      "domain driven design": "domain-driven design",
      "ddd": "domain-driven design",

      "clean-architecture": "clean architecture",

      "ports and adapters": "hexagonal architecture",
      "ports & adapters": "hexagonal architecture",

      "command query responsibility segregation": "cqrs",

      "event-sourcing": "event sourcing",

      "software design patterns": "design patterns",
      "design pattern": "design patterns",

      "solid": "solid principles",
      "solid principle": "solid principles",

      "oop": "object-oriented programming",
      "object oriented programming": "object-oriented programming",

      "functional-programming": "functional programming",

      "model view controller": "mvc",
      "model-view-controller": "mvc",

      "model view viewmodel": "mvvm",
      "model-view-viewmodel": "mvvm",

      "cicd": "ci/cd",
      "ci cd": "ci/cd",
      "ci-cd": "ci/cd",
      "continuous integration continuous delivery": "ci/cd",
      "continuous integration and continuous delivery": "ci/cd",
      "continuous integration continuous deployment": "ci/cd",
      "continuous integration and continuous deployment": "ci/cd",

      "agile methodology": "agile",
      "agile software development": "agile",

      "scrum framework": "scrum",
      "kanban board": "kanban",

      "atlassian jira": "jira",
      "atlassian confluence": "confluence",

      "node package manager": "npm",
      "yarn package manager": "yarn",
      "pnpm package manager": "pnpm",

      "apache maven": "maven",
      "mvn": "maven",

      "gradle build": "gradle",

      "python pip": "pip",
      "pip3": "pip",

      "python poetry": "poetry",
      "php composer": "composer",

      "nuget package manager": "nuget",
      "rust cargo": "cargo",

      "gnu make": "make",
      "makefile": "make",

      "c make": "cmake",
      "bazel build": "bazel",

      "vscode": "visual studio code",
      "vs code": "visual studio code",

      "intellij": "intellij idea",

      "py charm": "pycharm",
      "android-studio": "android studio",
      "x code": "xcode",

      "eclipse": "eclipse ide",

      "vi improved": "vim",

      "neo vim": "neovim",
      "nvim": "neovim",

      "javascript object notation": "json",
      "extensible markup language": "xml",

      "yml": "yaml",

      "protobuf": "protocol buffers",
      "proto buf": "protocol buffers",
      "google protobuf": "protocol buffers",

      "avro": "apache avro",
      "parquet": "apache parquet"
    }
  }
  $json$::jsonb,
  true
);

COMMIT;