import React, { useState, useEffect } from 'react';

const Todo = () => {
  const [inputTime, setInputTime] = useState('');
  const [inputURL, setInputURL] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showNewItem, setShowNewItem] = useState(true);
  const [showDelete, setShowDelete] = useState(true);
  const [showList, setShowList] = useState(true);
  const [toggleSubmit, setToggleSubmit] = useState(true);
  const [isEditItem, setIsEditItem] = useState(null);
  const [editMessage, setEditMessage] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [taskFrequency, setTaskFrequency] = useState('daily');
  const [items, setItems] = useState(() => {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
      const currentDayOfWeek = now.getDay(); // Dimanche = 0, ..., Samedi = 6
  
      setItems((prevItems) => {
        return prevItems.map((item) => {
          const lastResetDate = new Date(item.lastReset);
          const lastResetDay = lastResetDate.toISOString().split('T')[0];
  
          // Reset quotidien
          if (item.frequency === 'daily' && lastResetDay !== today) {
            item.progress = 0;
            item.lastReset = now.toISOString();
          }
  
          // Reset hebdomadaire
          if (item.frequency === 'weekly' && currentDayOfWeek === 0 && lastResetDay !== today) {
            item.progress = 0;
            item.lastReset = now.toISOString();
          }
  
          return item;
        });
      });
    }, 3600000); // Vérifie toutes les heures
  
    return () => clearInterval(intervalId);
  }, []);
  

  // Chargement initial des tâches depuis le Local Storage
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setItems(JSON.parse(storedTasks));
    }
  }, []);

  // Mise à jour du Local Storage chaque fois que les tâches changent
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(items));
  }, [items]);

// Logic to calculate and update task progress
  useEffect(() => {
    const intervalId = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const currentUrl = tabs[0].url;
      setItems((prevItems) => {
        return prevItems.map((item) => {
          if (item.progress < 100 && currentUrl.includes(item.URL)) {
            // Parse the "HH:MM" format into minutes
            const [hours, minutes] = item.time.split(':');
            const totalTime = parseInt(hours) * 60 + parseInt(minutes);

            // Calculate progress based on elapsed time in minutes
            const elapsedTime = (new Date() - new Date(item.lastReset)) / (60 * 1000);
            const newProgress = (Math.round((elapsedTime / totalTime) * 1000)/10);
            item.progress = newProgress;
          }
          return item;
        });
      });
    }
  });
}, 1000);// Update progress every second

    return () => {
      clearInterval(intervalId); // Cleanup when component unmounts
    };
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    if (name === 'title') {
      setInputTitle(value);
    } else if (name === 'description') {
      setInputDesc(value);
    } else if (name === 'url') {
      setInputURL(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputTitle || !inputDesc || !inputTime || !inputURL) {
      alert('Please fill in title, description, time, and URL.');
    } else if (inputTitle && !toggleSubmit) {
      // Logique pour la mise à jour d'une tâche existante
      setItems(
        items.map((item) => {
          if (item.id === isEditItem) {
            return {
              ...item,
              name: inputTitle,
              desc: inputDesc,
              time: inputTime,
              URL: inputURL,
              frequency: taskFrequency,
            };
          }
          return item;
        })
      );
      setIsEditItem(null);
      setToggleSubmit(true);
      setEditMessage(true);
      setTimeout(() => {
        setEditMessage(false);
      }, 2000);
    } else {
      // Logique pour ajouter une nouvelle tâche
      const newTask = {
        id: new Date().getTime().toString(),
        name: inputTitle,
        desc: inputDesc,
        time: inputTime,
        URL: inputURL,
        frequency: taskFrequency,
        lastReset: new Date().toISOString(),
        progress: 0, // Champ de progression initialisé à 0
      };
      setItems([newTask, ...items]);
    }

    // Réinitialisation des champs du formulaire
    setInputTitle('');
    setInputDesc('');
    setInputTime('');
    setInputURL('');
    setTaskFrequency('daily');
    setShowForm(false);
    setShowNewItem(true);
    setShowList(true);
  };

  const handleDelete = (id) => {
    const filteredItems = items.filter((item) => item.id !== id);
    setItems(filteredItems);
    setDeleteSuccessMessage(true);
    setTimeout(() => {
      setDeleteSuccessMessage(false);
    }, 2000);
  };

  const handleEdit = (id) => {
    const taskToEdit = items.find((item) => item.id === id);
    if (taskToEdit) {
      setShowForm(true);
      setToggleSubmit(false);
      setInputTitle(taskToEdit.name);
      setInputTime(taskToEdit.time);
      setInputURL(taskToEdit.URL);
      setInputDesc(taskToEdit.desc);
      setIsEditItem(id);
    }
  };

  const handleAdd = () => {
    setInputTitle('');
    setInputDesc('');
    setInputTime('');
    setInputURL('');
    setIsEditItem(null);
    setToggleSubmit(true);
    setShowForm(true);
    setShowNewItem(false);
    setShowList(true);
    setShowDelete(true);
  };

  return (
    <>
      {showNewItem && (
        <div className='first'>
              <div className='new-button-first'>
                <div className='col-12 text-end'>
                  <button className='btn btn-primary' onClick={handleAdd}>
                    New Task
                  </button>
                </div>
              </div>
        </div>
      )}

      {showForm && (
        <div className='container border rounded d-flex justify-content-center shadow p-3 mb-5 bg-white'>
          <div className='row'>
            <div className='col-12 text-center'>
              <h2>{toggleSubmit ? 'Add Task' : 'Edit Task'}</h2>
            </div>
            <form className='col-12 p-2' onSubmit={handleSubmit}>
              <label htmlFor='title' className='my-2 '>
                Enter Title
              </label>
              <input
                type='text'
                name='title'
                id='title'
                placeholder='Title'
                className='w-100 my-1 p-2'
                onChange={handleInput}
                value={inputTitle}
              />
              <label htmlFor='description' className='my-2'>
                Enter Description
              </label>
              <input
                type='text'
                name='description'
                id='description'
                placeholder='Description'
                className='w-100 my-1 p-2'
                onChange={handleInput}
                value={inputDesc}
              />
              <label htmlFor='time' className='my-2'>
                Enter Time
              </label>
              <input
                type='time'
                name='time'
                id='time'
                placeholder='HH:MM'
                className='w-100 my-1 p-2'
                onChange={(e) => setInputTime(e.target.value)}
                value={inputTime}
              />
              <label htmlFor='URL' className='my-2'>
                Enter URL
              </label>
              <input
                type='url'
                name='url'
                id='url'
                placeholder='URL'
                className='w-100 my-1 p-2'
                onChange={handleInput}
                value={inputURL}
              />
              <label htmlFor='frequency' className='my-2'>
                Choose frequency
              </label>
              <select
                name='frequency'
                id='frequency'
                className='w-100 my-1 p-2'
                value={taskFrequency}
                onChange={(e) => setTaskFrequency(e.target.value)}
              >
                <option value='daily'>Daily</option>
                <option value='weekly'>Weekly</option>
              </select>
              <button className='btn btn-primary my-2'>
                {toggleSubmit ? 'Save' : 'Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteSuccessMessage && (
        <div className='container py-2'>
          <p className='text-center text-danger'>Item Deleted Successfully</p>
        </div>
      )}

      {editMessage && (
        <div className='container py-2'>
          <p className='text-center text-success'>Item Updated Successfully</p>
        </div>
      )}
    {items.length > 0 ? (
      items.map((item) => (
        <div
          className='row border rounded shadow p-3 mb-3 bg-white'
          key={item.id}
        >
          <div className='container border rounded d-flex justify-content-center shadow p-3 mb-5 bg-white text-center'>
            <div>
              <h4>{item.name}</h4>
              <p>{item.desc}</p>
              <p>Time: {item.time}</p>
              <p>URL: {item.URL}</p>
              <p>Frequency: {item.frequency}</p>
              <p>Progress: {item.progress}%</p>
            </div>
            <div>
              <button
                className='btn btn-primary mx-2'
                onClick={() => handleEdit(item.id)}
              >
                Edit
              </button>
              {showDelete && (
                <button
                  className='btn btn-danger mx-2'
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))
    ):(
      <div className='text-center'>No task saved yet</div>
    )
    }
    </>
  );
};

export default Todo;