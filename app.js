document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const categorySelect = document.getElementById('categorySelect');
    const customCategory = document.getElementById('customCategory');
    const addTaskBtn = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter');
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    const applyDateFilterBtn = document.getElementById('applyDateFilter');
    const resetDateFilterBtn = document.getElementById('resetDateFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const applyCategoryFilterBtn = document.getElementById('applyCategoryFilter');
    const resetCategoryFilterBtn = document.getElementById('resetCategoryFilter');
    
    // 重複任務相關元素
    const showRecurringTaskModal = document.getElementById('showRecurringTaskModal');
    const recurringTaskModal = document.getElementById('recurringTaskModal');
    const closeModal = document.querySelector('.close-modal');
    const recurringTaskInput = document.getElementById('recurringTaskInput');
    const recurringTypeRadios = document.querySelectorAll('input[name="recurringType"]');
    const weeklyOptions = document.getElementById('weeklyOptions');
    const monthlyOptions = document.getElementById('monthlyOptions');
    const weekdayCheckboxes = document.querySelectorAll('input[name="weekday"]');
    const monthDaySelect = document.getElementById('monthDay');
    const recurringStartDate = document.getElementById('recurringStartDate');
    const recurringEndDate = document.getElementById('recurringEndDate');
    const addRecurringTasksButton = document.getElementById('addRecurringTasks');
    const cancelRecurringTasksButton = document.getElementById('cancelRecurringTasks');
    
    // 設置日期選擇器的預設值為今天
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // 確保DOM元素已載入後再設定日期
    if (taskDate) {
        taskDate.value = formattedDate;
        console.log('日期已設定為:', formattedDate);
    } else {
        console.error('taskDate 元素未找到');
    }
    
    // 格式化日期函數
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    
    // 設置重複任務的預設值
    // 預設選中星期一
    document.querySelector('input[name="weekday"][value="1"]').checked = true;
    
    // 本地儲存鍵名
    const STORAGE_KEY = 'todoList';
    
    // 當前過濾狀態
    let currentFilter = 'all';
    
    // 日期篩選狀態
    let dateFilterActive = false;
    let startDateFilter = null;
    let endDateFilter = null;
    
    // 類別篩選狀態
    let categoryFilterActive = false;
    let selectedCategoryFilter = null;
    
    // 自定義類別存儲
    let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    
    // 從本地儲存加載任務
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // 初始化應用
    initializeCategories();
    renderTasks();
    updateTaskCount();
    
    // 類別選擇器事件監聽
    categorySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customCategory.style.display = 'inline-block';
            customCategory.focus();
        } else {
            customCategory.style.display = 'none';
            customCategory.value = '';
        }
    });
    
    // 自定義類別輸入事件監聽
    customCategory.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const newCategory = this.value.trim();
            if (newCategory && !customCategories.includes(newCategory)) {
                customCategories.push(newCategory);
                localStorage.setItem('customCategories', JSON.stringify(customCategories));
                updateCategoryOptions();
                categorySelect.value = newCategory;
                this.style.display = 'none';
                this.value = '';
            }
        }
    });
    
    // 添加任務事件監聽
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 清除已完成任務事件監聽
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    // 過濾按鈕事件監聽
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    // 日期篩選按鈕事件監聽
    applyDateFilterBtn.addEventListener('click', () => {
        const startDate = filterStartDate.value;
        const endDate = filterEndDate.value;
        
        if (startDate && endDate) {
            // 將開始日期設為當天的00:00:00
            startDateFilter = new Date(startDate);
            startDateFilter.setHours(0, 0, 0, 0);
            
            // 將結束日期設為當天的23:59:59
            endDateFilter = new Date(endDate);
            endDateFilter.setHours(23, 59, 59, 999);
            
            // 檢查開始日期是否晚於結束日期
            if (startDateFilter > endDateFilter) {
                alert('開始日期不能晚於結束日期');
                return;
            }
            
            dateFilterActive = true;
            renderTasks();
            updateTaskCount();
        } else {
            alert('請選擇開始和結束日期');
        }
    });
    
    resetDateFilterBtn.addEventListener('click', () => {
        filterStartDate.value = '';
        filterEndDate.value = '';
        dateFilterActive = false;
        startDateFilter = null;
        endDateFilter = null;
        renderTasks();
        updateTaskCount();
    });
    
    // 類別篩選按鈕事件監聽
    applyCategoryFilterBtn.addEventListener('click', () => {
        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
            categoryFilterActive = true;
            selectedCategoryFilter = selectedCategory;
            renderTasks();
            updateTaskCount();
        } else {
            alert('請選擇要篩選的類別');
        }
    });
    
    resetCategoryFilterBtn.addEventListener('click', () => {
        categoryFilter.value = '';
        categoryFilterActive = false;
        selectedCategoryFilter = null;
        renderTasks();
        updateTaskCount();
    });
    
    // 重複任務彈窗控制
    showRecurringTaskModal.addEventListener('click', function() {
        recurringTaskModal.style.display = 'block';
        // 設置重複任務開始日期預設為今天
        recurringStartDate.value = formatDateShort(today);
        // 設置重複任務結束日期預設為一個月後
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        recurringEndDate.value = formatDateShort(nextMonth);
    });
    
    closeModal.addEventListener('click', function() {
        recurringTaskModal.style.display = 'none';
    });
    
    cancelRecurringTasksButton.addEventListener('click', function() {
        recurringTaskModal.style.display = 'none';
    });
    
    // 點擊彈窗外部關閉彈窗
    window.addEventListener('click', function(event) {
        if (event.target === recurringTaskModal) {
            recurringTaskModal.style.display = 'none';
        }
    });
    
    // 重複類型切換
    recurringTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'weekly') {
                weeklyOptions.style.display = 'block';
                monthlyOptions.style.display = 'none';
            } else if (this.value === 'monthly') {
                weeklyOptions.style.display = 'none';
                monthlyOptions.style.display = 'block';
            }
        });
    });
    
    // 添加新任務
    function addTask() {
        const taskText = taskInput.value.trim();
        const selectedDate = taskDate.value;
        let selectedCategory = categorySelect.value;
        
        // 處理自定義類別
        if (selectedCategory === 'custom') {
            const customCategoryValue = customCategory.value.trim();
            if (customCategoryValue) {
                if (!customCategories.includes(customCategoryValue)) {
                    customCategories.push(customCategoryValue);
                    localStorage.setItem('customCategories', JSON.stringify(customCategories));
                    updateCategoryOptions();
                }
                selectedCategory = customCategoryValue;
            } else {
                alert('請輸入自定義類別');
                customCategory.focus();
                return;
            }
        }
        
        if (taskText && selectedDate) {
            // 創建基於選擇日期的Date對象
            const taskDueDate = new Date(selectedDate);
            // 設置時間為當天的23:59:59
            taskDueDate.setHours(23, 59, 59, 999);
            
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: taskDueDate.toISOString(),
                category: selectedCategory || '未分類',
                isRecurring: false
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            updateTaskCount();
            updateCategoryFilter();
            
            // 清空輸入框
            taskInput.value = '';
            categorySelect.value = '';
            customCategory.style.display = 'none';
            customCategory.value = '';
            // 重設日期為今天
            taskDate.value = formattedDate;
            taskInput.focus();
        } else {
            // 如果沒有輸入文本或選擇日期，顯示提示
            if (!taskText) {
                alert('請輸入待辦事項內容');
                taskInput.focus();
            } else if (!selectedDate) {
                alert('請選擇待辦日期');
                taskDate.focus();
            }
        }
    }
    
    // 添加重複任務
     addRecurringTasksButton.addEventListener('click', function() {
         const taskText = recurringTaskInput.value.trim();
         const startDateValue = recurringStartDate.value;
         const endDateValue = recurringEndDate.value;
         
         if (!taskText) {
             alert('請輸入任務內容');
             return;
         }
         
         if (!startDateValue || !endDateValue) {
             alert('請選擇開始和結束日期');
             return;
         }
         
         // 設置開始日期為當天的開始 (00:00:00)
         const startDate = new Date(startDateValue);
         startDate.setHours(0, 0, 0, 0);
         
         // 設置結束日期為當天的結束 (23:59:59)
         const endDate = new Date(endDateValue);
         endDate.setHours(23, 59, 59, 999);
         
         // 驗證日期範圍
         if (startDate > endDate) {
             alert('開始日期不能晚於結束日期');
             return;
         }
         
         // 獲取重複類型
         const recurringType = document.querySelector('input[name="recurringType"]:checked').value;
         
         // 生成重複任務
         const recurringTasks = [];
         
         // 記錄無法添加任務的月份（移到外部作用域）
         const failedMonths = [];
         
         if (recurringType === 'weekly') {
             // 獲取選中的星期幾
             const selectedWeekdays = [];
             weekdayCheckboxes.forEach(checkbox => {
                 if (checkbox.checked) {
                     selectedWeekdays.push(parseInt(checkbox.value));
                 }
             });
             
             // 檢查是否至少選擇了一個星期幾
             if (selectedWeekdays.length === 0) {
                 alert('請至少選擇一個星期幾');
                 return;
             }
             
             // 記錄日期範圍內沒有符合條件的日期
             const missedDates = [];
             const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
             
             // 檢查日期範圍內是否有選中的星期幾
             let hasMatchingDay = false;
             const tempDate = new Date(startDate);
             while (tempDate <= endDate) {
                 const dayOfWeek = tempDate.getDay(); // 0-6, 0是星期日
                 if (selectedWeekdays.includes(dayOfWeek)) {
                     hasMatchingDay = true;
                     break;
                 }
                 tempDate.setDate(tempDate.getDate() + 1);
             }
             
             if (!hasMatchingDay) {
                 // 將選中的星期幾轉換為中文顯示
                 const selectedWeekdaysText = selectedWeekdays.map(day => weekdays[day]).join('、');
                 alert(`在選定的日期範圍 ${formatDateShort(startDate)} 至 ${formatDateShort(endDate)} 內沒有 ${selectedWeekdaysText}`);
                 return;
             }
             
             // 生成每週重複任務
             const currentDate = new Date(startDate);
             while (currentDate <= endDate) {
                 const dayOfWeek = currentDate.getDay(); // 0-6, 0是星期日
                 
                 if (selectedWeekdays.includes(dayOfWeek)) {
                     recurringTasks.push({
                         id: Date.now() + Math.floor(Math.random() * 1000),
                         text: taskText,
                         completed: false,
                         createdAt: new Date().toISOString(),
                         dueDate: new Date(currentDate).toISOString(),
                         isRecurring: true,
                         recurringType: 'weekly',
                         recurringDay: dayOfWeek
                     });
                 }
                 
                 // 前進一天
                 currentDate.setDate(currentDate.getDate() + 1);
             }
         } else if (recurringType === 'monthly') {
             // 獲取選中的每月幾號
             const selectedMonthDay = parseInt(monthDaySelect.value);
             
             // 生成每月重複任務
             const currentDate = new Date(startDate);
             let currentMonth = currentDate.getMonth();
             let currentYear = currentDate.getFullYear();
             
             // 遍歷從開始日期到結束日期的每個月
             while (new Date(currentYear, currentMonth, 1) <= endDate) {
                 // 檢查該月是否有選定的日期
                 // 獲取該月的最後一天
                 const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                 
                 if (selectedMonthDay <= lastDayOfMonth) {
                     // 該月有這一天，創建任務
                     const taskDate = new Date(currentYear, currentMonth, selectedMonthDay);
                     
                     // 確保日期在範圍內
                     if (taskDate >= startDate && taskDate <= endDate) {
                         recurringTasks.push({
                             id: Date.now() + Math.floor(Math.random() * 1000),
                             text: taskText,
                             completed: false,
                             createdAt: new Date().toISOString(),
                             dueDate: taskDate.toISOString(),
                             isRecurring: true,
                             recurringType: 'monthly',
                             recurringDay: selectedMonthDay
                         });
                     }
                 } else {
                     // 該月沒有這一天，記錄失敗
                     const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
                     failedMonths.push(`${currentYear}年${monthNames[currentMonth]}`);
                 }
                 
                 // 前進到下個月
                 currentMonth++;
                 if (currentMonth > 11) {
                     currentMonth = 0;
                     currentYear++;
                 }
             }
         }
         
         if (recurringTasks.length === 0) {
             alert('在選定的日期範圍內沒有符合條件的重複任務');
             return;
         }
         
         // 添加重複任務到任務列表
         tasks = tasks.concat(recurringTasks);
         saveTasks();
         renderTasks();
         updateTaskCount();
         
         // 在重置表單前先保存用戶選擇的日期（如果是每月重複任務）
         let selectedDayNumber = null;
         if (recurringType === 'monthly') {
             selectedDayNumber = parseInt(monthDaySelect.value);
         }
         
         // 關閉彈窗並重置表單
         recurringTaskModal.style.display = 'none';
         recurringTaskInput.value = '';
         weekdayCheckboxes.forEach(checkbox => checkbox.checked = false);
         weekdayCheckboxes[0].checked = true; // 預設選中星期一
         monthDaySelect.value = '1'; // 預設選中1號
         
         // 顯示成功訊息，如果有失敗的月份則一併顯示
         if (recurringType === 'monthly' && failedMonths && failedMonths.length > 0) {
             // 按年份分組月份
             const yearGroups = {};
             failedMonths.forEach(monthStr => {
                 const [year, month] = monthStr.split('年');
                 if (!yearGroups[year]) yearGroups[year] = [];
                 yearGroups[year].push(month);
             });
             
             // 格式化顯示
             const formattedMonths = Object.keys(yearGroups).map(year => {
                 return `${year}年${yearGroups[year].join('、')}`;
             }).join('、');
             
             alert(`成功添加 ${recurringTasks.length} 個任務\n無法添加：${selectedDayNumber}日 於 ${formattedMonths}`);
         } else {
             alert(`成功添加了 ${recurringTasks.length} 個重複任務`);
         }
     });
    
    // 切換任務完成狀態
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                // 如果任務從未完成變為已完成，記錄完成時間
                if (!task.completed) {
                    return { 
                        ...task, 
                        completed: true,
                        completedAt: new Date().toISOString() 
                    };
                } 
                // 如果任務從已完成變為未完成，記錄重新激活時間
                else {
                    return { 
                        ...task, 
                        completed: false,
                        reactivatedAt: new Date().toISOString() 
                    };
                }
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // 刪除任務
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // 清除已完成任務
    function clearCompleted() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // 保存任務到本地儲存
    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    
    // 渲染任務列表
    function renderTasks() {
        // 清空任務列表
        taskList.innerHTML = '';
        
        // 更新日期篩選區域的視覺狀態
        if (dateFilterActive) {
            document.querySelector('.date-filter').classList.add('active');
        } else {
            document.querySelector('.date-filter').classList.remove('active');
        }
        
        // 根據過濾條件篩選任務
        let filteredTasks = tasks;
        
        // 先按完成狀態篩選
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        // 再按日期範圍篩選（如果日期篩選已啟用）
        if (dateFilterActive && startDateFilter && endDateFilter) {
            filteredTasks = filteredTasks.filter(task => {
                // 使用任務的截止日期進行篩選
                const taskDate = new Date(task.dueDate || task.createdAt);
                return taskDate >= startDateFilter && taskDate <= endDateFilter;
            });
        }
        
        // 按類別篩選（如果類別篩選已啟用）
        if (categoryFilterActive && selectedCategoryFilter) {
            filteredTasks = filteredTasks.filter(task => {
                return (task.category || '未分類') === selectedCategoryFilter;
            });
        }
        
        // 按創建時間排序（最新的在前面）
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 創建任務元素
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // 如果是重複任務，添加特殊類別
            if (task.isRecurring) {
                taskItem.classList.add('recurring-task');
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            
            // 為重複任務添加標記
            if (task.isRecurring) {
                let recurringLabel = '';
                if (task.recurringType === 'weekly') {
                    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                    recurringLabel = `[每週${weekdays[task.recurringDay]}] `;
                } else if (task.recurringType === 'monthly') {
                    recurringLabel = `[每月${task.recurringDay}日] `;
                }
                taskText.textContent = recurringLabel + task.text;
            } else {
                taskText.textContent = task.text;
            }
            
            // 創建類別元素
            const categoryElement = document.createElement('span');
            categoryElement.className = 'task-category';
            categoryElement.textContent = `[${task.category || '未分類'}]`;
            categoryElement.style.color = '#666';
            categoryElement.style.fontSize = '0.9em';
            categoryElement.style.marginLeft = '8px';
            
            // 創建日期元素
            const taskDate = document.createElement('span');
            taskDate.className = 'task-date';
            const date = new Date(task.dueDate || task.createdAt);
            
            // 檢查是否為截止日期
            if (task.dueDate) {
                // 只顯示日期部分，不顯示時間
                const dueYear = date.getFullYear();
                const dueMonth = String(date.getMonth() + 1).padStart(2, '0');
                const dueDay = String(date.getDate()).padStart(2, '0');
                taskDate.textContent = `截止日期: ${dueYear}-${dueMonth}-${dueDay}`;
                
                // 如果截止日期已過且任務未完成，添加過期樣式
                if (!task.completed && new Date() > date) {
                    taskDate.classList.add('overdue');
                }
            } else {
                // 如果沒有截止日期，顯示創建日期
                taskDate.textContent = `創建於: ${formatDate(date)}`;
            }
            
            // 創建狀態時間元素
            const statusTimeElement = document.createElement('span');
            statusTimeElement.className = 'status-time';
            
            // 根據任務狀態顯示相應的時間信息
            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                statusTimeElement.textContent = `完成於: ${formatDate(completedDate)}`;
                statusTimeElement.classList.add('completed-time');
            } else if (!task.completed && task.reactivatedAt) {
                const reactivatedDate = new Date(task.reactivatedAt);
                statusTimeElement.textContent = `重新激活於: ${formatDate(reactivatedDate)}`;
                statusTimeElement.classList.add('reactivated-time');
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskText);
            taskItem.appendChild(categoryElement);
            taskItem.appendChild(taskDate);
            
            // 只有在有狀態時間時才添加該元素
            if (statusTimeElement.textContent) {
                taskItem.appendChild(statusTimeElement);
            }
            
            taskItem.appendChild(deleteBtn);
            
            taskList.appendChild(taskItem);
        });
    }
    
    // 更新任務計數
    function updateTaskCount() {
        const activeTaskCount = tasks.filter(task => !task.completed).length;
        let countText = `${activeTaskCount} 個待辦事項`;
        
        // 如果日期篩選已啟用，顯示篩選日期範圍
        if (dateFilterActive && startDateFilter && endDateFilter) {
            const startDateStr = formatDateShort(startDateFilter);
            const endDateStr = formatDateShort(endDateFilter);
            countText += ` (${startDateStr} 至 ${endDateStr})`;
        }
        
        taskCount.textContent = countText;
    }
    
    // 簡短日期格式化函數（僅顯示年-月-日）
    function formatDateShort(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 初始化類別選項
    function initializeCategories() {
        updateCategoryOptions();
        updateCategoryFilter();
    }
    
    // 更新類別選擇器選項
    function updateCategoryOptions() {
        // 保存原始HTML結構
        const originalHTML = categorySelect.innerHTML;
        
        // 如果有自定義類別，需要添加到選擇器中
        if (customCategories.length > 0) {
            // 找到自定義選項的位置（在最後一個option之前）
            const customOption = categorySelect.querySelector('option[value="custom"]');
            
            // 移除已存在的自定義類別選項
            const existingCustomOptions = categorySelect.querySelectorAll('option:not([data-default="true"])');
            existingCustomOptions.forEach(option => {
                if (option.value !== 'custom') {
                    option.remove();
                }
            });
            
            // 添加自定義類別
            customCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.insertBefore(option, customOption);
            });
        }
    }
    
    // 更新類別篩選器選項
    function updateCategoryFilter() {
        // 獲取所有已使用的類別
        const usedCategories = [...new Set(tasks.map(task => task.category || '未分類'))];
        
        // 清空篩選器選項
        categoryFilter.innerHTML = '<option value="">選擇類別</option>';
        
        // 添加已使用的類別到篩選器
        usedCategories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    // 全域函數，供HTML調用
    window.toggleTask = function(id) {
        toggleTaskStatus(id);
    };
    
    window.deleteTask = deleteTask;
});