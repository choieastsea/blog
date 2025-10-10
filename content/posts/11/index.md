---
title: SQLAlchemy (3) Session
date: "2025-04-15"
toc: true
summary: "session / 트랜잭션 관리 / orm 모델 정의 / 쿼리 실행 관련 메서드/ engine, connection, session 비교"
readTime: true
autonumber: false
showTags: true
tags: [python, sqlalchemy, orm, session]
---



지금까지 sqlalchemy의 `core layer`에 대해 공부했고, 이제는 `orm layer`에 대해 알아보자. SQLAlchemy를 이용한 application을 다루게 된다면 가장 많이 접할 것이다.

# Session

session은 sqlalchemy 객체로, DBMS와 ORM수준으로 **상호작용하고 트랜잭션을 관리하기 위한 객체**이다.

생성하는 방법으로는 몇가지가 있는데, 모두 `Engine` 인스턴스가 필요하다.

1. `Session(Engine)`

2. `sessionmaker(bind=Engine)`를 통한 생성

   sessionmaker는 <u>Session을 생성하기 위한 factory</u>이며 호출시 session을 생성해준다. sessionmaker 역시 Engine처럼 보통 DB당 하나씩만 있으면 된다.

Session 객체는 context manager로도 가능하다. https://github.com/zzzeek/sqlalchemy/blob/main/lib/sqlalchemy/orm/session.py#L1798-L1802 해당 코드를 보면, context manager가 닫힐 때(`__exit__`), connection이 존재한다면 반환하는 `close()`메서드가 실행됨을 알 수 있다.



주의할 점으로는 *Session 객체가 생성되었다고 해서 connection이 할당된 것은 아니라는 점*이다. 다음 코드를 interactive mode로 실행해보면 알 수 있다.

```python
# test.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine("mysql+pymysql://root:password@localhost/test_db", echo=True)

sessionmaker = sessionmaker(bind=engine)
session = sessionmaker()

❯ python -i test.py
>>> (아무것도 출력되지 않는다)
>>> session
<sqlalchemy.orm.session.Session object at 0x106472710>
>>> engine.pool.status()
'Pool size: 5  Connections in pool: 0 Current Overflow: -5 Current Checked out connections: 0'
```

**session이 생겼다고 해서 connection을 가져오지(`engine.connect()`) 않은 것**을 확인할 수 있다. *실제 DB 실행시에 connection 객체를 lazy하게 가져온다.*

## 트랜잭션 관리

- `begin()` : engine과 마찬가지로, **application 내 트랜잭션이 시작됨을 명시하지만, `BEGIN/START transaction;` 쿼리는 암묵적으로 수행된다.**
- `close()` : 세션을 종료하는 메서드이다. context manager를 사용했다면 나가면서 호출되고, 그렇지 않다면 명시적으로 닫아주도록 한다. 그러면 해당 트랜잭션을 깔끔하게 정리할 것이다.
- `commit()`  : 커밋 쿼리를 수행한다.
- `rollback()` : 롤백 쿼리를 수행한다.

begin() 메서드 역시, `contextmanager`로도 활용될 수 있어서 다음과 같은 방법이 존재한다. [출처](https://docs.sqlalchemy.org/en/20/orm/session_basics.html#framing-out-a-begin-commit-rollback-block)

```python
# 1
with Session(engine) as session:
    session.begin()
    try:
        session.add(some_object)
        session.add(some_other_object)
    except:
        session.rollback()
        raise
    else:
        session.commit()
        
# 2
with Session(engine) as session:
    with session.begin():
        session.add(some_object)
        session.add(some_other_object)

# 3
with Session(engine) as session, session.begin():
    session.add(some_object)
    session.add(some_other_object)
```

begin()시에는 트랜잭션이 열리며, `close()`시에 rollback()/commit()이 실행된다.

**begin() 역시 engine과 마찬가지로 쿼리가 나감(+connection을 가져옴)을 보장하지 않는다!** 

역으로, `close()` 메서드도 connection이 할당되지 않았다면 굳이 쿼리가 나가지 않을 것이다.

```python
❯ python -i test.py
>>> session.begin()
<sqlalchemy.orm.session.SessionTransaction object at 0x1046085f0>
# transaction을 열었다고 해서 begin/start 쿼리가 나가지 않는다
>>> engine.pool.status()
'Pool size: 5  Connections in pool: 0 Current Overflow: -5 Current Checked out connections: 0'
```

## ORM 모델 정의

세션 객체로 쿼리를 수행하기 위해 간단한 ORM entity를 정의해보자. 

```mysql
CREATE TABLE item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Item(Base):
    __tablename__ = "item"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

```

[Declaritve definition](https://docs.sqlalchemy.org/en/20/orm/mapping_styles.html#orm-declarative-mapping)으로 모델을 정의하였다. 모델을 정의하는 방법에 대해서는 기회가 되면 다루도록 하겠다😅

## 쿼리 실행 관련 메서드

- `add(obj)`

  ORM 객체는 세션을 통해 추가/변경/삭제 되어야하는데, 세션에 등록되지 않은 객체는 add 메서드를 통해 추가될 수 있다.

  ```python
  ❯ python -i test.py
  >>> session._new
  {}
  >>> item1 = Item(name='item1', price=10000)
  >>> session.add(item1)
  >>> session._new
  {<sqlalchemy.orm.state.InstanceState object at 0x102679970>: <__main__.Item object at 0x104a5b790>}
  >>> session.add(item1) # 한번 더 추가
  {<sqlalchemy.orm.state.InstanceState object at 0x102679970>: <__main__.Item object at 0x104a5b790>} # 같은 결과
  ```

  위의 예제에서, item1은 생성되었지만 session과 연결되지 않아 add로 추가해주었다. Session은 해당 트랜잭션 내에 추가될 것(new), 변경될 것(dirty), 삭제될 객체(deleted)들을 `IdentitySet`라고 하는 set 자료형 내에서 관리된다. 따라서 `id(obj)`가 같은 객체를 계속 add하더라도 session에는 추가되지 않음을 확인할 수 있다.

- `flush()`

  DBMS에 session을 영속화하는 메서드이다. *commit은 수행하지 않는다.*

  ```python
  >>> session.flush()
  2025-04-15 22:37:01,312 INFO sqlalchemy.engine.Engine SELECT DATABASE()
  2025-04-15 22:37:01,312 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:37:01,314 INFO sqlalchemy.engine.Engine SELECT @@sql_mode
  2025-04-15 22:37:01,314 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:37:01,315 INFO sqlalchemy.engine.Engine SELECT @@lower_case_table_names
  2025-04-15 22:37:01,315 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:37:01,316 INFO sqlalchemy.engine.Engine BEGIN (implicit)
  2025-04-15 22:37:01,321 INFO sqlalchemy.engine.Engine INSERT INTO item (name, price) VALUES (%(name)s, %(price)s)
  2025-04-15 22:37:01,321 INFO sqlalchemy.engine.Engine [generated in 0.00017s] {'name': 'item1', 'price': 10000}
  >>> engine.pool.status()
  'Pool size: 5  Connections in pool: 0 Current Overflow: -4 Current Checked out connections: 1'
  >>> session.in_transaction()
  True
  ```

  실행되는 query는 session의 상태에 따라 flush 시점에 결정되어 수행된다. session 초기화 시점이 아닌 **실제 connection이 필요한 시기에 lazy 하게 가져옴**을 확인할 수 있다.

  Session은 identity map 이라는 곳에 데이터를 저장(in memory)해놓고 `flush()` 시점에 변경 작업들을 한번에 반영하는데, 이러한 측면에서  `unit of work` 패턴을 나타낸다.

- `refresh(obj)`

  해당 객체를 최신화하는데 사용한다. 외부 요인으로 인해 객체가 변경됐을 수도 있는데, 이를 확인하기 위해 사용한다. select 쿼리가 나간다.

- `delete(obj)`

​	해당 ORM 객체를 지운다. `session._deleted` identity set에 추가되고 flush시에 delete 쿼리가 나갈 것이다.

- `execute(statement)`

  쿼리를 만들고 이를 수행하기 위해 사용한다.

  ```python
  >>> stmt = select(Item).where(Item.name=='item1')
  >>> session.execute(stmt)
  2025-04-15 22:50:05,789 INFO sqlalchemy.engine.Engine SELECT DATABASE()
  2025-04-15 22:50:05,789 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:50:05,790 INFO sqlalchemy.engine.Engine SELECT @@sql_mode
  2025-04-15 22:50:05,790 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:50:05,791 INFO sqlalchemy.engine.Engine SELECT @@lower_case_table_names
  2025-04-15 22:50:05,791 INFO sqlalchemy.engine.Engine [raw sql] {}
  2025-04-15 22:50:05,792 INFO sqlalchemy.engine.Engine BEGIN (implicit)
  2025-04-15 22:50:05,793 INFO sqlalchemy.engine.Engine SELECT item.id, item.name, item.price, item.created_at 
  FROM item 
  WHERE item.name = %(name_1)s
  2025-04-15 22:50:05,793 INFO sqlalchemy.engine.Engine [generated in 0.00010s] {'name_1': 'item1'}
  <sqlalchemy.engine.result.ChunkedIteratorResult object at 0x105c83c50>
  ```

  해당 시점에 쿼리가 수행되지만 **결과가 메모리에 적재되지는 않는다**고 한다. 따라서 `all(), first(), one(), one_or_none()` 등 메서드를 통해 이를 application memory로 가져온다. 이렇게 나눠진 이유는 execute는 **사실 Python DB API에서 쿼리를 호출하고(execute), 데이터를 메모리로 가져오는(fetch) 시점이 나뉘어져있기 때문**이다. [참고](https://choieastsea.github.io/posts/8/#cursor)

- `scalars/scalar(statement)`

  역시 쿼리를 실행하고, `ScalarResult` 타입을 반환한다.



ORM 객체들은 세션에 의해 DBMS로 영속화될 수 있는데, 이를 관리하기 위한 state가 존재한다. [공식 문서](https://docs.sqlalchemy.org/en/20/orm/session_state_management.html)를 참고하여 간단한 컨셉을 이해하면 좋을 것이다.



# engine ↔️ connection ↔️ session

이제, engine, connection, session에 대해 알아봤는데, 차이점을 정리해보자.

engine은 **connection들을 관리하기 위한 connection pool과 DBMS 마다 쿼리를 실행하기 위한 Dialect를 포함한 객체**이다.

connection은 [DB API의 connection](https://peps.python.org/pep-0249/#connection-objects)을 래핑한 객체이다. **DBMS의 TCP connection을 application간의 connection**객체로 갖고 있는다.

session은 **하나의 트랜잭션을 수행하고 ORM 객체와 매핑과 영속화를 수행**하기 위한 객체이다.



이 정도로 SQLAlchemy의 컨셉 정도는 알아본 것 같다. 개인적으로는 engine, connection, session의 개념과 DBAPI와의 관계를 명확하게 이해하고, 알케미를 활용한다면 더욱 효율적이고 생산적인 코드를 만들 수 있을 것이라고 생각한다.



화이팅 😎

