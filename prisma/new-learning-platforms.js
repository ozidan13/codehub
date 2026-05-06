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
    description: 'Learn computer networking from zero to hero — OSI, TCP/IP, routing, switching, security, packet analysis, and CCNA prep.',
    url: 'https://ozidan13.github.io/network/',
    courseLink: 'https://ozidan13.github.io/network/',
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
      title: 'Why Networks?',
      description: 'Understand why we need computer networks and how they enable modern communication.',
      link: 'https://ozidan13.github.io/network/Unit1/why_networks.html',
      order: 1
    },
    {
      title: 'Network Types',
      description: 'Compare PAN, LAN, MAN, and WAN network types and their use cases.',
      link: 'https://ozidan13.github.io/network/Unit1/network_types.html',
      order: 2
    },
    {
      title: 'Topologies',
      description: 'Learn network topologies including bus, star, ring, mesh, and hybrid layouts.',
      link: 'https://ozidan13.github.io/network/Unit1/network_topologies.html',
      order: 3
    },
    {
      title: 'Network Hardware',
      description: 'Study routers, switches, hubs, NICs, and other network hardware devices.',
      link: 'https://ozidan13.github.io/network/Unit1/network_hardware.html',
      order: 4
    },
    {
      title: 'Network History',
      description: 'Review the evolution of networks from ARPANET to modern 5G infrastructure.',
      link: 'https://ozidan13.github.io/network/Unit1/network_history.html',
      order: 5
    },
    {
      title: 'OSI Model',
      description: 'Understand the seven layers of the OSI reference model and their functions.',
      link: 'https://ozidan13.github.io/network/Unit2/osi_model.html',
      order: 6
    },
    {
      title: 'TCP/IP Model',
      description: 'Learn the practical TCP/IP four-layer model and how it maps to OSI.',
      link: 'https://ozidan13.github.io/network/Unit2/tcp_ip_model.html',
      order: 7
    },
    {
      title: 'Encapsulation',
      description: 'Study how data is encapsulated and decapsulated as it traverses the network stack.',
      link: 'https://ozidan13.github.io/network/Unit2/encapsulation.html',
      order: 8
    },
    {
      title: 'Protocols Intro',
      description: 'Get an introduction to network protocols and how they enable communication.',
      link: 'https://ozidan13.github.io/network/Unit2/protocols_intro.html',
      order: 9
    },
    {
      title: 'Addressing Basics',
      description: 'Learn the fundamentals of network addressing including MAC and IP addresses.',
      link: 'https://ozidan13.github.io/network/Unit2/addressing_basics.html',
      order: 10
    },
    {
      title: 'Transmission Media',
      description: 'Compare wired and wireless transmission media used in networking.',
      link: 'https://ozidan13.github.io/network/Unit3/transmission_media.html',
      order: 11
    },
    {
      title: 'Signal Encoding',
      description: 'Understand signals, encoding techniques, and how data is represented on the wire.',
      link: 'https://ozidan13.github.io/network/Unit3/signal_encoding.html',
      order: 12
    },
    {
      title: 'Multiplexing',
      description: 'Learn how multiplexing enables multiple signals to share a single channel.',
      link: 'https://ozidan13.github.io/network/Unit3/multiplexing.html',
      order: 13
    },
    {
      title: 'Switching Types',
      description: 'Compare circuit switching and packet switching in network communication.',
      link: 'https://ozidan13.github.io/network/Unit3/switching_transmission.html',
      order: 14
    },
    {
      title: 'Framing & Error',
      description: 'Study data link layer framing and error detection techniques.',
      link: 'https://ozidan13.github.io/network/Unit4/framing_error.html',
      order: 15
    },
    {
      title: 'MAC & Ethernet',
      description: 'Learn MAC addresses and how Ethernet operates at the data link layer.',
      link: 'https://ozidan13.github.io/network/Unit4/mac_addresses.html',
      order: 16
    },
    {
      title: 'Switching & VLANs',
      description: 'Configure switches and understand VLAN segmentation in local networks.',
      link: 'https://ozidan13.github.io/network/Unit4/switching_vlans.html',
      order: 17
    },
    {
      title: 'Spanning Tree',
      description: 'Understand the Spanning Tree Protocol and how it prevents Layer 2 loops.',
      link: 'https://ozidan13.github.io/network/Unit4/spanning_tree.html',
      order: 18
    },
    {
      title: 'WiFi & Wireless',
      description: 'Study wireless networking standards, WiFi operation, and security.',
      link: 'https://ozidan13.github.io/network/Unit4/wifi_wireless.html',
      order: 19
    },
    {
      title: 'IP Addressing',
      description: 'Master IPv4 addressing, classes, private ranges, and CIDR notation.',
      link: 'https://ozidan13.github.io/network/Unit5/ip_addressing.html',
      order: 20
    },
    {
      title: 'Subnetting',
      description: 'Practice subnetting IPv4 networks and calculating hosts per subnet.',
      link: 'https://ozidan13.github.io/network/Unit5/subnetting.html',
      order: 21
    },
    {
      title: 'IPv6',
      description: 'Learn IPv6 addressing, notation, and coexistence strategies with IPv4.',
      link: 'https://ozidan13.github.io/network/Unit5/ipv6.html',
      order: 22
    },
    {
      title: 'Routing Basics',
      description: 'Understand routing fundamentals and how packets are forwarded between networks.',
      link: 'https://ozidan13.github.io/network/Unit5/routing_basics.html',
      order: 23
    },
    {
      title: 'Routing Protocols',
      description: 'Compare distance-vector and link-state protocols including RIP, OSPF, and BGP.',
      link: 'https://ozidan13.github.io/network/Unit5/routing_protocols.html',
      order: 24
    },
    {
      title: 'NAT & DHCP',
      description: 'Learn Network Address Translation and Dynamic Host Configuration Protocol.',
      link: 'https://ozidan13.github.io/network/Unit5/nat_dhcp.html',
      order: 25
    },
    {
      title: 'ICMP & ARP',
      description: 'Study ICMP for diagnostics and ARP for address resolution on local networks.',
      link: 'https://ozidan13.github.io/network/Unit5/icmp_arp.html',
      order: 26
    },
    {
      title: 'TCP vs UDP',
      description: 'Compare TCP and UDP transport protocols and when to use each.',
      link: 'https://ozidan13.github.io/network/Unit6/tcp_udp.html',
      order: 27
    },
    {
      title: 'TCP Connection',
      description: 'Study the three-way handshake, connection teardown, and TCP state machine.',
      link: 'https://ozidan13.github.io/network/Unit6/tcp_connection.html',
      order: 28
    },
    {
      title: 'Flow Control',
      description: 'Understand TCP flow control and congestion avoidance mechanisms.',
      link: 'https://ozidan13.github.io/network/Unit6/flow_congestion.html',
      order: 29
    },
    {
      title: 'Ports & Sockets',
      description: 'Learn about port numbers and how sockets enable application communication.',
      link: 'https://ozidan13.github.io/network/Unit6/ports_sockets.html',
      order: 30
    },
    {
      title: 'HTTP & HTTPS',
      description: 'Study web protocols including HTTP methods, status codes, and TLS encryption.',
      link: 'https://ozidan13.github.io/network/Unit7/http_https.html',
      order: 31
    },
    {
      title: 'DNS',
      description: 'Understand how the Domain Name System resolves hostnames to IP addresses.',
      link: 'https://ozidan13.github.io/network/Unit7/dns.html',
      order: 32
    },
    {
      title: 'Email Protocols',
      description: 'Compare SMTP, POP3, and IMAP protocols used for email communication.',
      link: 'https://ozidan13.github.io/network/Unit7/email_protocols.html',
      order: 33
    },
    {
      title: 'FTP & SSH',
      description: 'Learn file transfer with FTP and secure remote access with SSH.',
      link: 'https://ozidan13.github.io/network/Unit7/ftp_ssh.html',
      order: 34
    },
    {
      title: 'DHCP & SNMP',
      description: 'Study network management protocols including DHCP and SNMP.',
      link: 'https://ozidan13.github.io/network/Unit7/dhcp_snmp.html',
      order: 35
    },
    {
      title: 'Security Concepts',
      description: 'Learn the CIA triad and foundational network security concepts.',
      link: 'https://ozidan13.github.io/network/Unit8/security_concepts.html',
      order: 36
    },
    {
      title: 'Cryptography',
      description: 'Study symmetric and asymmetric encryption including AES and RSA.',
      link: 'https://ozidan13.github.io/network/Unit8/cryptography.html',
      order: 37
    },
    {
      title: 'Firewalls & IDS',
      description: 'Configure firewalls and understand Intrusion Detection Systems.',
      link: 'https://ozidan13.github.io/network/Unit8/firewalls_ids.html',
      order: 38
    },
    {
      title: 'VPN & Tunneling',
      description: 'Learn how VPNs and tunneling protocols secure remote network access.',
      link: 'https://ozidan13.github.io/network/Unit8/vpn_tunneling.html',
      order: 39
    },
    {
      title: 'Ethical Hacking',
      description: 'Get an introduction to ethical hacking and penetration testing basics.',
      link: 'https://ozidan13.github.io/network/Unit8/ethical_hacking.html',
      order: 40
    },
    {
      title: 'Cisco IOS CLI',
      description: 'Practice Cisco router and switch configuration using the IOS command line.',
      link: 'https://ozidan13.github.io/network/Unit9/cisco_cli.html',
      order: 41
    },
    {
      title: 'Packet Analysis',
      description: 'Use Wireshark to capture and analyze network traffic packets.',
      link: 'https://ozidan13.github.io/network/Unit9/packet_analysis.html',
      order: 42
    },
    {
      title: 'Troubleshooting',
      description: 'Apply systematic troubleshooting methods to diagnose network issues.',
      link: 'https://ozidan13.github.io/network/Unit9/network_troubleshooting.html',
      order: 43
    },
    {
      title: 'Network Design',
      description: 'Design scalable and reliable network architectures for real scenarios.',
      link: 'https://ozidan13.github.io/network/Unit9/network_design.html',
      order: 44
    },
    {
      title: 'Cloud Networking',
      description: 'Study virtual networks, subnets, and cloud provider networking services.',
      link: 'https://ozidan13.github.io/network/Unit9/cloud_networking.html',
      order: 45
    },
    {
      title: 'Capstone: Network Design',
      description: 'Complete a full network design project from requirements to topology.',
      link: 'https://ozidan13.github.io/network/Unit10/capstone_design.html',
      order: 46
    },
    {
      title: 'Capstone: Traffic Analysis',
      description: 'Perform real-world traffic analysis and document findings.',
      link: 'https://ozidan13.github.io/network/Unit10/capstone_analysis.html',
      order: 47
    },
    {
      title: 'Certifications',
      description: 'Prepare for CCNA, Network+, and cloud networking certifications.',
      link: 'https://ozidan13.github.io/network/Unit10/certifications.html',
      order: 48
    },
    {
      title: 'Career Guide',
      description: 'Plan next steps for a career in networking and network engineering.',
      link: 'https://ozidan13.github.io/network/Unit10/career_guide.html',
      order: 49
    }
  ]
}

module.exports = {
  newPlatforms,
  newPlatformTasks
}
