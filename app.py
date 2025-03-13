from flask import Flask, render_template, request, jsonify
import random
import copy

app = Flask(__name__)

@app.route('/')
def index():
    n = 5
    return render_template('index.html', n=n)

@app.route('/generate_policy_value', methods=['POST'])
def generate_policy_value():
    data = request.json
    n = int(data['n'])
    grid_status = data['grid_status']

    directions = {'↑': (-1, 0), '↓': (1, 0), '←': (0, -1), '→': (0, 1)}
    policy = [['' for _ in range(n)] for _ in range(n)]
    value = [[0 for _ in range(n)] for _ in range(n)]  # 初始 V(s) 為 0

    gamma = 0.9  # 折扣因子
    reward = -1  # 每步懲罰
    threshold = 0.01  # 收斂條件

    # 找終點位置
    end_pos = None
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 2:
                end_pos = (i, j)

    # 根據終點，產生「導向終點」策略
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 0 or grid_status[i][j] == 1:  # 空格或起點
                ei, ej = end_pos
                moves = []
                if i > ei and grid_status[i-1][j] != 3:  # 上
                    moves.append('↑')
                if i < ei and grid_status[i+1][j] != 3:  # 下
                    moves.append('↓')
                if j > ej and grid_status[i][j-1] != 3:  # 左
                    moves.append('←')
                if j < ej and grid_status[i][j+1] != 3:  # 右
                    moves.append('→')
                if not moves:
                    for dir, (di, dj) in directions.items():  # 若無路，再取其他方向
                        ni, nj = i + di, j + dj
                        if 0 <= ni < n and 0 <= nj < n and grid_status[ni][nj] != 3:
                            moves.append(dir)
                if moves:
                    policy[i][j] = random.choice(moves)
                else:
                    policy[i][j] = ''

    # 策略評估 (迭代)
    for _ in range(1000):  # 最多 1000 次
        delta = 0
        new_value = copy.deepcopy(value)
        for i in range(n):
            for j in range(n):
                if grid_status[i][j] == 3 or grid_status[i][j] == 2:  # 障礙與終點不計算
                    continue
                action = policy[i][j]
                if action == '':
                    continue  # 無動作
                di, dj = directions[action]
                ni, nj = i + di, j + dj
                if 0 <= ni < n and 0 <= nj < n and grid_status[ni][nj] != 3:
                    next_v = value[ni][nj]  # 可行方向的 value
                else:
                    next_v = value[i][j]  # 撞牆原地

                new_value[i][j] = reward + gamma * next_v  # 策略評估公式
                delta = max(delta, abs(new_value[i][j] - value[i][j]))
        value = new_value
        if delta < threshold:
            break  # 收斂則停止

    # 終點固定為 0
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 2:
                value[i][j] = 0

    # 四捨五入保留兩位小數
    value = [[round(v, 2) for v in row] for row in value]

    return jsonify({'policy': policy, 'value': value})

if __name__ == '__main__':
    app.run(debug=True)