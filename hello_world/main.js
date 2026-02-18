const neo4j = require('neo4j-driver');


const uri = 'neo4j://127.0.0.1:7687';
const user = 'neo4j';
const password = 'kmw23gihquphf';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

async function run() {
    try {
        // Создание узла в БД
        const createResult = await session.run(
            'CREATE (a:Person {name: $name, age: $age}) RETURN a',
            { name: 'Egor', age: 20 }
        );
        console.log('Node created:', createResult.records[0].get('a').properties);

        // Чтение данных из БД
        const readResult = await session.run(
            'MATCH (a:Person) WHERE a.name = $name RETURN a',
            { name: 'Egor' }
        );

        readResult.records.forEach(record => {
            console.log('Node data:', record.get('a').properties);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await session.close();
    }
    await driver.close();
}


run();