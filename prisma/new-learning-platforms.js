const newPlatforms = [
  {
    name: 'Database Learning Platform',
    description: 'Learn SQL, PostgreSQL, Prisma, backend database integration, indexing, transactions, NoSQL, and database projects.',
    url: 'https://ozidan13.github.io/database/',
    courseLink: 'https://ozidan13.github.io/database/',
    price: 400.00,
    isPaid: true
  },
  {
    name: 'System Design Platform',
    description: 'Learn system design fundamentals, distributed system components, scalability patterns, case studies, and interview frameworks.',
    url: 'https://systemdesign-one.vercel.app/',
    courseLink: 'https://systemdesign-one.vercel.app/module01_intro_to_sd',
    price: 400.00,
    isPaid: true
  },
  {
    name: 'Networking Learning Platform',
    description: 'Learn networking basics, APIs, protocols, load balancing, and messaging concepts used in distributed systems.',
    url: 'https://systemdesign-one.vercel.app/',
    courseLink: 'https://systemdesign-one.vercel.app/module02_networking_basics',
    price: 400.00,
    isPaid: true
  }
]

const newPlatformTasks = {
  'Database Learning Platform': [
    {
      title: 'Why Databases?',
      description: 'Understand why applications need databases and how DBMSs solve file-based data problems.',
      link: 'https://ozidan13.github.io/database/Unit1/why_databases.html',
      order: 1
    },
    {
      title: 'Database Types',
      description: 'Compare relational, document, key-value, graph, column-family, and time-series databases.',
      link: 'https://ozidan13.github.io/database/Unit1/database_types.html',
      order: 2
    },
    {
      title: 'Database Architecture',
      description: 'Learn database architecture and how database systems are structured internally.',
      link: 'https://ozidan13.github.io/database/Unit1/database_architecture.html',
      order: 3
    },
    {
      title: 'PostgreSQL Setup',
      description: 'Install and configure PostgreSQL for local database development.',
      link: 'https://ozidan13.github.io/database/Unit1/postgresql_setup.html',
      order: 4
    },
    {
      title: 'Database History',
      description: 'Review the evolution of database systems and why modern databases look the way they do.',
      link: 'https://ozidan13.github.io/database/Unit1/database_history.html',
      order: 5
    },
    {
      title: 'ER Basics',
      description: 'Learn entity relationship diagram fundamentals.',
      link: 'https://ozidan13.github.io/database/Unit2/er_basics.html',
      order: 6
    },
    {
      title: 'ER Relationships',
      description: 'Model one-to-one, one-to-many, and many-to-many relationships.',
      link: 'https://ozidan13.github.io/database/Unit2/er_relationships.html',
      order: 7
    },
    {
      title: 'EER Diagrams',
      description: 'Use enhanced ER modeling concepts for more advanced schemas.',
      link: 'https://ozidan13.github.io/database/Unit2/eer_diagrams.html',
      order: 8
    },
    {
      title: 'Relational Model',
      description: 'Understand relations, tables, keys, tuples, and relational constraints.',
      link: 'https://ozidan13.github.io/database/Unit2/relational_model.html',
      order: 9
    },
    {
      title: 'ER To Tables',
      description: 'Convert ER diagrams into relational database tables.',
      link: 'https://ozidan13.github.io/database/Unit2/er_to_relational.html',
      order: 10
    },
    {
      title: 'DDL Basics',
      description: 'Create and modify tables using CREATE, ALTER, and DROP.',
      link: 'https://ozidan13.github.io/database/Unit3/ddl_basics.html',
      order: 11
    },
    {
      title: 'CRUD Operations',
      description: 'Use SQL statements to create, read, update, and delete data.',
      link: 'https://ozidan13.github.io/database/Unit3/dml_crud.html',
      order: 12
    },
    {
      title: 'Aggregation And Grouping',
      description: 'Use aggregate functions and GROUP BY for analytical queries.',
      link: 'https://ozidan13.github.io/database/Unit3/aggregate_grouping.html',
      order: 13
    },
    {
      title: 'JOIN Mastery',
      description: 'Query related tables using SQL joins.',
      link: 'https://ozidan13.github.io/database/Unit3/joins_mastery.html',
      order: 14
    },
    {
      title: 'Subqueries And Sets',
      description: 'Use subqueries and set operations in SQL.',
      link: 'https://ozidan13.github.io/database/Unit3/subqueries_sets.html',
      order: 15
    },
    {
      title: 'Views And CTEs',
      description: 'Use views and common table expressions to structure queries.',
      link: 'https://ozidan13.github.io/database/Unit4/views_ctes.html',
      order: 16
    },
    {
      title: 'Window Functions',
      description: 'Use SQL window functions for ranking, running totals, and partitioned calculations.',
      link: 'https://ozidan13.github.io/database/Unit4/window_functions.html',
      order: 17
    },
    {
      title: 'Advanced Types',
      description: 'Work with advanced PostgreSQL data types.',
      link: 'https://ozidan13.github.io/database/Unit4/advanced_types.html',
      order: 18
    },
    {
      title: 'Functions And Triggers',
      description: 'Create database functions and triggers for database-side behavior.',
      link: 'https://ozidan13.github.io/database/Unit4/functions_triggers.html',
      order: 19
    },
    {
      title: 'Functional Dependencies',
      description: 'Learn functional dependencies as the basis of normalization.',
      link: 'https://ozidan13.github.io/database/Unit5/functional_dependencies.html',
      order: 20
    },
    {
      title: 'Normalization',
      description: 'Normalize schemas through 1NF, 2NF, 3NF, and BCNF.',
      link: 'https://ozidan13.github.io/database/Unit5/normalization.html',
      order: 21
    },
    {
      title: 'Denormalization',
      description: 'Understand when and why to denormalize database schemas.',
      link: 'https://ozidan13.github.io/database/Unit5/denormalization.html',
      order: 22
    },
    {
      title: 'Design Workshop',
      description: 'Practice complete database schema design from requirements.',
      link: 'https://ozidan13.github.io/database/Unit5/design_workshop.html',
      order: 23
    },
    {
      title: 'Express And PostgreSQL',
      description: 'Connect Node.js and Express applications to PostgreSQL.',
      link: 'https://ozidan13.github.io/database/Unit6/express_pg_basics.html',
      order: 24
    },
    {
      title: 'Prisma ORM Intro',
      description: 'Use Prisma ORM to model and query databases from application code.',
      link: 'https://ozidan13.github.io/database/Unit6/prisma_intro.html',
      order: 25
    },
    {
      title: 'Prisma Relations',
      description: 'Model and query relations with Prisma.',
      link: 'https://ozidan13.github.io/database/Unit6/prisma_relations.html',
      order: 26
    },
    {
      title: 'NestJS And Prisma',
      description: 'Build a complete API with NestJS and Prisma.',
      link: 'https://ozidan13.github.io/database/Unit6/nestjs_prisma.html',
      order: 27
    },
    {
      title: 'Migrations And Seeding',
      description: 'Manage schema migrations and seed database data.',
      link: 'https://ozidan13.github.io/database/Unit6/migrations_seeding.html',
      order: 28
    },
    {
      title: 'ACID Properties',
      description: 'Understand atomicity, consistency, isolation, and durability.',
      link: 'https://ozidan13.github.io/database/Unit7/acid_transactions.html',
      order: 29
    },
    {
      title: 'Concurrency Problems',
      description: 'Recognize race conditions and concurrency anomalies in databases.',
      link: 'https://ozidan13.github.io/database/Unit7/concurrency_problems.html',
      order: 30
    },
    {
      title: 'Isolation Levels',
      description: 'Compare database transaction isolation levels.',
      link: 'https://ozidan13.github.io/database/Unit7/isolation_levels.html',
      order: 31
    },
    {
      title: 'Locks And Recovery',
      description: 'Learn locking and recovery mechanisms in database systems.',
      link: 'https://ozidan13.github.io/database/Unit7/locking_recovery.html',
      order: 32
    },
    {
      title: 'EXPLAIN ANALYZE',
      description: 'Read PostgreSQL query execution plans.',
      link: 'https://ozidan13.github.io/database/Unit8/explain_analyze.html',
      order: 33
    },
    {
      title: 'Indexing Deep Dive',
      description: 'Use indexes to improve database query performance.',
      link: 'https://ozidan13.github.io/database/Unit8/indexing_deep_dive.html',
      order: 34
    },
    {
      title: 'Query Optimization',
      description: 'Optimize SQL queries and database access patterns.',
      link: 'https://ozidan13.github.io/database/Unit8/query_optimization.html',
      order: 35
    },
    {
      title: 'Partitioning And Scaling',
      description: 'Use partitioning and scaling strategies for large datasets.',
      link: 'https://ozidan13.github.io/database/Unit8/partitioning_scaling.html',
      order: 36
    },
    {
      title: 'NoSQL Overview',
      description: 'Understand NoSQL database categories and tradeoffs.',
      link: 'https://ozidan13.github.io/database/Unit9/nosql_overview.html',
      order: 37
    },
    {
      title: 'MongoDB Basics',
      description: 'Learn document database basics with MongoDB.',
      link: 'https://ozidan13.github.io/database/Unit9/mongodb_basics.html',
      order: 38
    },
    {
      title: 'Redis Caching',
      description: 'Use Redis for caching and fast key-value storage.',
      link: 'https://ozidan13.github.io/database/Unit9/redis_caching.html',
      order: 39
    },
    {
      title: 'Choosing A Database',
      description: 'Choose the right database for a system based on requirements.',
      link: 'https://ozidan13.github.io/database/Unit9/choosing_database.html',
      order: 40
    },
    {
      title: 'E-Commerce Project',
      description: 'Design and implement a database-backed e-commerce project.',
      link: 'https://ozidan13.github.io/database/Unit10/capstone_ecommerce.html',
      order: 41
    },
    {
      title: 'Analytics Dashboard',
      description: 'Build a database-powered analytics dashboard project.',
      link: 'https://ozidan13.github.io/database/Unit10/capstone_analytics.html',
      order: 42
    },
    {
      title: 'Database Security',
      description: 'Apply security practices to database systems.',
      link: 'https://ozidan13.github.io/database/Unit10/database_security.html',
      order: 43
    },
    {
      title: 'Career Guide',
      description: 'Plan next steps for database learning and database-related careers.',
      link: 'https://ozidan13.github.io/database/Unit10/career_guide.html',
      order: 44
    }
  ],
  'System Design Platform': [
    {
      title: 'Intro To System Design',
      description: 'Learn the core concepts and goals of system design.',
      link: 'https://systemdesign-one.vercel.app/module01_intro_to_sd',
      order: 1
    },
    {
      title: 'Networking Basics',
      description: 'Understand networking fundamentals for distributed systems.',
      link: 'https://systemdesign-one.vercel.app/module02_networking_basics',
      order: 2
    },
    {
      title: 'APIs And Protocols',
      description: 'Learn API design and common communication protocols.',
      link: 'https://systemdesign-one.vercel.app/module03_apis_protocols',
      order: 3
    },
    {
      title: 'Databases And Storage',
      description: 'Choose storage systems based on consistency, scale, and access patterns.',
      link: 'https://systemdesign-one.vercel.app/module04_databases',
      order: 4
    },
    {
      title: 'Caching Strategies',
      description: 'Use caching to improve latency, throughput, and resilience.',
      link: 'https://systemdesign-one.vercel.app/module05_caching',
      order: 5
    },
    {
      title: 'Load Balancing',
      description: 'Distribute traffic across services with load balancing techniques.',
      link: 'https://systemdesign-one.vercel.app/module06_load_balancing',
      order: 6
    },
    {
      title: 'Message Queues',
      description: 'Use queues for asynchronous processing and decoupled services.',
      link: 'https://systemdesign-one.vercel.app/module07_message_queues',
      order: 7
    },
    {
      title: 'System Components',
      description: 'Understand the core building blocks of production systems.',
      link: 'https://systemdesign-one.vercel.app/module08_system_components',
      order: 8
    },
    {
      title: 'Database Scaling',
      description: 'Scale databases with replication, sharding, partitioning, and read/write patterns.',
      link: 'https://systemdesign-one.vercel.app/module09_database_scaling',
      order: 9
    },
    {
      title: 'Consistency And Availability',
      description: 'Understand CAP theorem and consistency tradeoffs.',
      link: 'https://systemdesign-one.vercel.app/module10_consistency_availability',
      order: 10
    },
    {
      title: 'Design Patterns',
      description: 'Apply common system design patterns.',
      link: 'https://systemdesign-one.vercel.app/module11_design_patterns',
      order: 11
    },
    {
      title: 'URL Shortener Case Study',
      description: 'Design a URL shortener system end to end.',
      link: 'https://systemdesign-one.vercel.app/module12_case_study_url_shortener',
      order: 12
    },
    {
      title: 'Chat System Case Study',
      description: 'Design a real-time chat system.',
      link: 'https://systemdesign-one.vercel.app/module13_case_study_chat_system',
      order: 13
    },
    {
      title: 'Social Media Feed Case Study',
      description: 'Design a social media feed and timeline system.',
      link: 'https://systemdesign-one.vercel.app/module14_case_study_social_media',
      order: 14
    },
    {
      title: 'Video Platform Case Study',
      description: 'Design a video hosting and streaming platform.',
      link: 'https://systemdesign-one.vercel.app/module15_case_study_video_platform',
      order: 15
    },
    {
      title: 'Interview Framework',
      description: 'Use a structured framework for system design interviews.',
      link: 'https://systemdesign-one.vercel.app/module16_interview_framework',
      order: 16
    }
  ],
  'Networking Learning Platform': [
    {
      title: 'Networking Basics',
      description: 'Understand core networking concepts used in web and distributed systems.',
      link: 'https://systemdesign-one.vercel.app/module02_networking_basics',
      order: 1
    },
    {
      title: 'APIs And Protocols',
      description: 'Learn HTTP, APIs, and service communication protocols.',
      link: 'https://systemdesign-one.vercel.app/module03_apis_protocols',
      order: 2
    },
    {
      title: 'Load Balancing',
      description: 'Learn how load balancers route and distribute network traffic.',
      link: 'https://systemdesign-one.vercel.app/module06_load_balancing',
      order: 3
    },
    {
      title: 'Message Queues',
      description: 'Understand asynchronous networked communication with message queues.',
      link: 'https://systemdesign-one.vercel.app/module07_message_queues',
      order: 4
    }
  ]
}

module.exports = {
  newPlatforms,
  newPlatformTasks
}
