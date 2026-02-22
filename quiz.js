
        let current = 0;
        let answers = [];
        let timeLeft = 45 * 60;
        let timerInterval;

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function shuffleOptions(q) {
            let combined = q.options.map(opt => ({
                text: opt,
                isCorrect: Array.isArray(q.correct) ? q.correct.includes(opt) : q.correct === opt
            }));

            shuffle(combined);  // reuse the shuffle function

            q.options = combined.map(item => item.text);
            if (Array.isArray(q.correct)) {
                q.correct = combined.filter(item => item.isCorrect).map(item => item.text);
            } else {
                q.correct = combined.find(item => item.isCorrect)?.text;
            }
        }

        function start() {
            shuffle(questions);
            questions.forEach(shuffleOptions);
            createProgressBlocks();
            startTimer();
            showQuestion(current);
            document.getElementById("backBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "inline-block";
        }

        function showQuestion(i) {
            const q = questions[i];
            let html = `<div class="question">
                <h3>Question ${i + 1} of ${questions.length}</h3>
                <p>${q.question}</p>`;

            if (q.type === "multiple") {
                html += '<p><small>(select all that apply)</small></p>';
            }

            q.options.forEach((opt, idx) => {
                const type = q.type === "multiple" ? "checkbox" : "radio";
                html += `<label>
                    <input type="${type}" name="ans" value="${idx}">
                    ${opt}</label>`;
            });

            html += `</div>`;

            document.getElementById("questionArea").innerHTML = html;

            // restore answers
            if (answers[i]) {
                document.querySelectorAll('input[name="ans"]').forEach(input => {
                    if (answers[i].includes(parseInt(input.value))) {
                        input.checked = true;
                    }
                });
            }

            document.getElementById("backBtn").style.display = current === 0 ? "none" : "inline-block";
            document.getElementById("nextBtn").textContent = current === questions.length - 1 ? "Submit" : "Next";
            updateProgressBlocks();
        }

        function checkAndNext() {
            const selected = [...document.querySelectorAll('input[name="ans"]:checked')]
                .map(el => parseInt(el.value));

            answers[current] = selected;

            if (current === questions.length - 1) {
                // Check if all questions answered
                const unanswered = answers.reduce((count, ans, i) => {
                    return count + (ans && ans.length > 0 ? 0 : 1);
                }, 0);

                if (unanswered > 0) {
                    if (confirm(`You haven't answered all question(s). Are you sure to submit?`)) {
                        showResult();
                    }
                } else {
                    if (confirm("Are you sure to submit?")) {
                        showResult();
                    }
                }
                return;
            }

            current++;
            showQuestion(current);
            updateProgressBlocks();
        }

        function goBack() {
            if (current > 0) {
                current--;
                showQuestion(current);
            }
            updateProgressBlocks();
        }

        // showResult, startTimer remain the same (fix typos: percent, PASS/Fail)

        document.getElementById("nextBtn").onclick = checkAndNext;
        document.getElementById("backBtn").onclick = goBack;
        function showResult() {
            let score = 0;
            let html = '<div class="result">';

            // Final score at the top
            questions.forEach((q, i) => {
                const selected = answers[i] || [];
                const correctIndices = Array.isArray(q.correct)
                    ? q.correct.map(opt => q.options.indexOf(opt))
                    : [q.options.indexOf(q.correct)];

                if (selected.length === correctIndices.length && selected.every(v => correctIndices.includes(v))) {
                    score++;
                }
            });

            const percent = Math.round((score / questions.length) * 100);
            const pass = score >= 18;

            html += `
    <h2 style="margin:0 0 20px;">Final Score: ${score} / ${questions.length} (${percent}%)</h2>
    <p style="color:${pass ? 'green' : 'red'}; font-weight:bold; font-size:1.6em; margin:0 0 30px;">
      ${pass ? "PASS" : "FAIL"}
    </p>`;

            // Then detailed per-question results
            questions.forEach((q, i) => {
                const selected = answers[i] || [];
                const correctIndices = Array.isArray(q.correct)
                    ? q.correct.map(opt => q.options.indexOf(opt))
                    : [q.options.indexOf(q.correct)];

                const isCorrect = selected.length === correctIndices.length &&
                    selected.every(v => correctIndices.includes(v));

                html += `
      <div style="margin:20px 0; padding:15px; border:1px solid #ddd; border-radius:8px;">
        <strong>Question ${i + 1}:</strong> ${q.question}<br><br>
        <strong>Your answer:</strong> 
        ${selected.length === 0 ? '<span style="color:#888;">No answer</span>' :
                        selected.map(idx => q.options[idx]).join(', ')}<br>
        <strong>Correct answer:</strong> 
        ${Array.isArray(q.correct) ? q.correct.join(', ') : q.correct}<br>
        <strong>Status:</strong> 
        <span style="color:${isCorrect ? 'green' : 'red'}">
          ${isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>`;
            });

            html += `<button onclick="window.location.href='index.html'" style="margin:20px 10px; background:#666; color:white;">
    Go Back to Home
  </button>
    <button onclick="location.reload()" style="margin-top:30px;">Restart Quiz</button>
  </div>`;

            document.getElementById("questionArea").innerHTML = html;
            document.getElementById("backBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "none";
            clearInterval(timerInterval);
        }

        function createProgressBlocks() {
            const container = document.getElementById("progress-blocks");
            container.innerHTML = "";
            for (let i = 1; i <= questions.length; i++) {
                const block = document.createElement("div");
                block.className = "block";
                block.textContent = i;
                block.dataset.num = i;
                block.onclick = () => jumpToQuestion(i - 1);
                container.appendChild(block);
            }
        }

        function updateProgressBlocks() {
            document.querySelectorAll(".block").forEach(block => {
                const qNum = parseInt(block.dataset.num) - 1;
                block.classList.remove("current");
                if (qNum === current) {
                    block.classList.add("current");
                }
                if (answers[qNum] && answers[qNum].length > 0) {
                    block.classList.add("answered");
                }
            });
        }

        function jumpToQuestion(index) {
            if (index >= 0 && index < questions.length) {
                current = index;
                showQuestion(current);
            }
            updateProgressBlocks();
        }
        start();

        function startTimer() {
            timerInterval = setInterval(() => {
                timeLeft--;

                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;

                document.getElementById("timer").textContent =
                    `Time Remaining: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    showResult();  // auto submit when time ends
                }
            }, 1000);
        }


