import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";

const normalizeTodos = (value) => (Array.isArray(value) ? value : []);

const buildApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) return "/api/todos";

  return configuredUrl.endsWith("/todos")
    ? configuredUrl
    : `${configuredUrl.replace(/\/$/, "")}/todos`;
};

const API_URL = buildApiUrl();

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    axios
      .get(API_URL)
      .then((res) => {
        if (ignore) return;
        setTodos(normalizeTodos(res.data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching todos:", err);
        if (!ignore) {
          setTodos([]);
          setLoading(false);
        }
      });

    inputRef.current?.focus();

    return () => {
      ignore = true;
    };
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    try {
      const res = await axios.post(API_URL, { text: trimmedText });
      setTodos((prevTodos) => [res.data, ...normalizeTodos(prevTodos)]);
      setText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error adding todo:", err);
    }
  };

  const toggleTodo = async (todo) => {
    try {
      const res = await axios.put(`${API_URL}/${todo._id}`, {
        completed: !todo.completed,
      });
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t._id === res.data._id ? res.data : t)),
      );
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos((prevTodos) => prevTodos.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  const todosList = normalizeTodos(todos);
  const remaining = todosList.filter((t) => !t.completed).length;
  const progress = todosList.length
    ? (todosList.length - remaining) / todosList.length
    : 0;

  return (
    <div className="page">
      <motion.div
        className="app"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <header className="app-header">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Todo List
          </motion.h1>

          <AnimatePresence mode="wait">
            {!loading && todosList.length > 0 && (
              <motion.p
                key={remaining === 0 ? "done" : "remaining"}
                className="subtitle"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
              >
                {remaining === 0
                  ? "All done! 🎉"
                  : `${remaining} of ${todosList.length} remaining`}
              </motion.p>
            )}
          </AnimatePresence>

          {todosList.length > 0 && (
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}
        </header>

        <form onSubmit={addTodo} className="todo-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="What needs to be done?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add
          </motion.button>
        </form>

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : (
          <AnimatePresence>
            {todosList.length === 0 ? (
              <motion.div
                key="empty"
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <motion.span
                  className="empty-icon"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  📝
                </motion.span>
                <p>No todos yet. Add one above!</p>
              </motion.div>
            ) : (
              <motion.ul layout className="todo-list">
                <AnimatePresence>
                  {todosList.map((todo) => (
                    <motion.li
                      key={todo._id}
                      layout
                      initial={{ opacity: 0, x: -30, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, scale: 0.9 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={todo.completed ? "completed" : ""}
                    >
                      <label className="todo-check">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo)}
                        />
                        <motion.span
                          className="checkmark"
                          animate={
                            todo.completed
                              ? { scale: [1, 1.3, 1] }
                              : { scale: 1 }
                          }
                          transition={{ duration: 0.3 }}
                        />
                      </label>
                      <span className="todo-text">{todo.text}</span>
                      <motion.button
                        className="delete-btn"
                        onClick={() => deleteTodo(todo._id)}
                        aria-label="Delete todo"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ✕
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

export default App;
