'use strict'

import Promise from 'bluebird'
import chai from 'chai'
import supertest from 'supertest-as-promised'
import Todo from '../lib/todos'
import app from '../app'

Promise.promisifyAll(Todo)

const request = supertest(app)
const expect = chai.expect

describe('todos', () => {

  beforeEach(() => {
    return Todo
      .findAsync()
      .then((todos) => {
        return Promise.all(todos.map((todo) => Todo.deleteAsync(todo.id)))
      })
  })

  it('gets empty array with no todos', () => {
    return request.get('/api/todos')
      .expect(200, [])
  })

  it('gets a list of todos with a few todos', () => {
    return Promise
      .all([
        Todo.createAsync({ name: 'foo' }),
        Todo.createAsync({ name: 'bar' }),
        Todo.createAsync({ name: 'hello' })
      ])
      .then((todos) => {
        expect(todos).to.have.length(3)
        return request.get('/api/todos')
          .expect(200)
      })
      .then((response) => {
        expect(response.body).to.have.length(3)
        response.body.forEach((todo) => {
          expect(todo).to.have.keys('name', 'completed', 'id')
        })
      })
  })

  it('creates a todo', () => {
    return request.post('/api/todos')
      .send({ name: 'foo', completed: true })
      .expect(201)
      .then((res) => {
        const todo = res.body
        expect(todo).to.have.property('name', 'foo')
        expect(todo).to.have.property('completed', true)
        expect(todo).to.have.property('id')
        return Todo.findOneAsync(todo.id)
      })
      .then((todo) => {
        expect(todo).to.have.property('name', 'foo')
        expect(todo).to.have.property('completed', true)
      })
  })

  it('defaults created to false', () => {
    return request.post('/api/todos')
      .send({ name: 'foo' })
      .expect(201)
      .then((res) => {
        const todo = res.body
        expect(todo).to.have.property('completed', false)
      })
  })

  it('updates a todo', () => {
    let id
    return Todo.createAsync({ name: 'foo' })
      .then((todo) => {
        id = todo.id
        expect(todo.name).to.be.equal('foo')
        return request.put(`/api/todos/${todo.id}`)
          .send({ name: 'bar' })
          .expect(200)
      })
      .then(() => {
        return Todo.findOneAsync(id)
      })
      .then((todo) => {
        expect(todo.name).to.be.equal('bar')
      })
  })

  it('deletes a todo', () => {
    let id
    return Todo.createAsync({ name: 'bar' })
      .then((todo) => {
        id = todo.id
        return request.delete(`/api/todos/${todo.id}`)
          .expect(204)
      })
      .then((todo) => {
        return Todo.findOneAsync(id)
          .catch((err) => {
            expect(err).to.match(/not found/)
          })
      })
  })

  it('fails to update if id does not exist', () => {
    return request.put('/api/todos/1')
      .send({ name: 'won\'t update' })
      .expect(500)
  })

  it('fails to delete if id does not exist', () => {
    return request.delete('/api/todos/1')
      .expect(500)
  })

})




