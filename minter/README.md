## NFT backend minter
A NFT backend minter with rabbitmq service.

## Installation
```
npm install
```

## Run minter
- Uncomment minter caller
```bash
npx ts-node minter.ts 
```

## Rabbit MQ

#### Installation:
```bash
sudo apt-get install rabbitmq-server
```

#### Web UI:
```bash
sudo rabbitmq-plugins enable rabbitmq_management
```

#### Admin user:
```bash
sudo rabbitmqctl add_user admin <password>
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

#### Vhost:
```bash
sudo rabbitmqctl add_vhost nft
sudo rabbitmqctl set_permissions -p nft guest ".*" ".*" ".*"
```
